[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [string]$ConfigRoot = (Join-Path $HOME '.config/opencode'),
    [switch]$SetDefault
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$agentSource = Join-Path $sourceRoot '.opencode/agents'
$agentTarget = Join-Path $ConfigRoot 'agents'
$manifestPath = Join-Path $ConfigRoot 'ai-team-managed.json'
$configPath = Join-Path $ConfigRoot 'opencode.json'

function Read-StrictJson([string]$Path) {
    $text = [IO.File]::ReadAllText($Path)
    # ConvertFrom-Json accepts duplicate object keys on some PowerShell versions.
    # Track object-key tokens separately so no existing values can be silently lost.
    $tokens = [regex]::Matches($text, '"(?:\\.|[^"\\])*"|[{}\[\],:]')
    $masked = [regex]::Replace($text, '"(?:\\.|[^"\\])*"', '""')
    if ($masked -match '//|/\*|\*/|,\s*[}\]]') { throw "JSONC is not supported for safe merge: $Path" }
    $stack = New-Object System.Collections.ArrayList
    foreach ($token in $tokens) {
        $value = $token.Value
        if ($value -eq '{') {
            [void]$stack.Add(@{ type = 'object'; keys = @{}; key = $true })
        } elseif ($value -eq '[') {
            [void]$stack.Add(@{ type = 'array' })
        } elseif ($value -eq '}' -or $value -eq ']') {
            if ($stack.Count -gt 0) { $stack.RemoveAt($stack.Count - 1) }
        } elseif ($stack.Count -gt 0) {
            $frame = $stack[$stack.Count - 1]
            if ($frame.type -eq 'object') {
                if ($value -eq ',') { $frame.key = $true }
                elseif ($value.StartsWith('"') -and $frame.key) {
                    $key = ConvertFrom-Json -InputObject $value
                    if ($frame.keys.ContainsKey($key)) { throw "Duplicate JSON key '$key' in $Path" }
                    $frame.keys[$key] = $true
                    $frame.key = $false
                }
            }
        }
    }
    try { $parsed = ConvertFrom-Json -InputObject $text } catch { throw "Invalid JSON in ${Path}: $_" }
    if ($null -eq $parsed -or $parsed -isnot [pscustomobject]) { throw "Expected JSON object in $Path" }
    return $parsed
}

function Hash-File([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '')
    } finally {
        $sha.Dispose()
        $stream.Dispose()
    }
}

function Set-Field([object]$Object, [string]$Name, [object]$Value, [object]$Previous, [string]$Label) {
    $property = $Object.PSObject.Properties[$Name]
    if ($null -ne $property) {
        if ($property.Value -ne $Value -and ($null -eq $Previous -or $property.Value -ne $Previous)) {
            throw "Unmanaged conflicting $Label; refusing overwrite"
        }
        $property.Value = $Value
    } else {
        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
    }
}

function Save-Managed([string]$Path, [string]$Content) {
    if (Test-Path -LiteralPath $Path) {
        $backup = "$Path.backup.$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss')).$([guid]::NewGuid().ToString('N'))"
        Copy-Item -LiteralPath $Path -Destination $backup -ErrorAction Stop
        Write-Host "Backup: $backup"
    }
    [IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

$manifest = [pscustomobject]@{ files = [pscustomobject]@{}; config = [pscustomobject]@{} }
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Read-StrictJson $manifestPath
    if ($null -eq $manifest.PSObject.Properties['files'] -or
        $null -eq $manifest.PSObject.Properties['config'] -or
        $manifest.files -isnot [pscustomobject] -or $manifest.config -isnot [pscustomobject]) {
        throw "Invalid managed manifest: $manifestPath"
    }
}

$pending = @()
foreach ($source in @(Get-ChildItem -LiteralPath $agentSource -Filter 'ai-team-*.md' -File)) {
    $target = Join-Path $agentTarget $source.Name
    $hash = Hash-File $source.FullName
    $record = $manifest.files.PSObject.Properties[$source.Name]
    if (Test-Path -LiteralPath $target) {
        $actual = Hash-File $target
        if ($null -eq $record -or $actual -ne $record.Value) {
            throw "Unmanaged or modified agent file; refusing overwrite: $target"
        }
    } elseif ($null -ne $record) {
        throw "Managed agent was removed; refusing to recreate without investigation: $target"
    }
    if (-not (Test-Path -LiteralPath $target) -or $actual -ne $hash) {
        $pending += [pscustomobject]@{ path = $target; source = $source.FullName }
    }
    if ($null -eq $record) {
        $manifest.files | Add-Member -NotePropertyName $source.Name -NotePropertyValue $hash
    } else {
        $record.Value = $hash
    }
}

$configContent = $null
if ($SetDefault) {
    if (Test-Path -LiteralPath (Join-Path $ConfigRoot 'opencode.jsonc')) {
        throw 'Existing opencode.jsonc cannot be safely merged; remove the conflict manually after review'
    }
    $config = [pscustomobject]@{}
    if (Test-Path -LiteralPath $configPath) { $config = Read-StrictJson $configPath }
    $previous = $manifest.config
    $desired = [ordered]@{ model = 'openai/gpt-6-astra'; default_agent = 'ai-team-leader' }
    foreach ($name in $desired.Keys) {
        $old = $previous.PSObject.Properties[$name]
        $oldValue = if ($null -eq $old) { $null } else { $old.Value }
        Set-Field $config $name $desired[$name] $oldValue $name
        Set-Field $previous $name $desired[$name] $oldValue "manifest $name"
    }
    $experimental = $config.PSObject.Properties['experimental']
    if ($null -eq $experimental) {
        $config | Add-Member -NotePropertyName experimental -NotePropertyValue ([pscustomobject]@{})
    } elseif ($experimental.Value -isnot [pscustomobject]) {
        throw 'Conflicting experimental setting; expected object'
    }
    $oldExperimental = $previous.PSObject.Properties['experimental']
    if ($null -eq $oldExperimental) {
        $previous | Add-Member -NotePropertyName experimental -NotePropertyValue ([pscustomobject]@{})
    } elseif ($oldExperimental.Value -isnot [pscustomobject]) {
        throw 'Invalid managed experimental settings'
    }
    foreach ($name in @('todo', 'subagent_depth')) {
        $value = if ($name -eq 'todo') { $true } else { 1 }
        $old = $previous.experimental.PSObject.Properties[$name]
        $oldValue = if ($null -eq $old) { $null } else { $old.Value }
        Set-Field $config.experimental $name $value $oldValue "experimental.$name"
        Set-Field $previous.experimental $name $value $oldValue "manifest experimental.$name"
    }
    if ($null -eq $config.PSObject.Properties['$schema']) {
        $config | Add-Member -NotePropertyName '$schema' -NotePropertyValue 'https://opencode.ai/config.json'
    }
    $configContent = ConvertTo-Json -InputObject $config -Depth 100
    if (Test-Path -LiteralPath $configPath) {
        if ([IO.File]::ReadAllText($configPath) -eq $configContent) { $configContent = $null }
    }
}

$manifestContent = ConvertTo-Json -InputObject $manifest -Depth 100
$manifestChanged = -not (Test-Path -LiteralPath $manifestPath) -or
    [IO.File]::ReadAllText($manifestPath) -ne $manifestContent
if ($pending.Count -eq 0 -and $null -eq $configContent -and -not $manifestChanged) {
    Write-Host 'Already up to date.'
    return
}
if ($PSCmdlet.ShouldProcess($ConfigRoot, 'Install namespaced agents and optional default config')) {
    [void](New-Item -ItemType Directory -Path $agentTarget -Force)
    foreach ($item in $pending) {
        Save-Managed $item.path ([IO.File]::ReadAllText($item.source))
        Write-Host "Installed: $($item.path)"
    }
    if ($null -ne $configContent) { Save-Managed $configPath $configContent }
    if ($manifestChanged) { Save-Managed $manifestPath $manifestContent }
}
