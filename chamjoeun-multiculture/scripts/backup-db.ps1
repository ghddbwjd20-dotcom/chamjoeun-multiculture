$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$backupDirectory = Join-Path $projectRoot '.local/backups'
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$backupFile = Join-Path $backupDirectory ('chamjoeun-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.dump')
$runtimeConfig = Get-Content -LiteralPath '.local/runtime.json' -Raw | ConvertFrom-Json
$pgDump = Join-Path $runtimeConfig.runtime 'bin/pg_dump.exe'
if (-not (Test-Path -LiteralPath $pgDump)) {
    $installedPgDump = Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'PostgreSQL') -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'bin/pg_dump.exe' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $installedPgDump) { throw 'Install PostgreSQL client tools (pg_dump) matching the server major version.' }
    $pgDump = $installedPgDump
}
$localDatabasePassword = (Get-Content -LiteralPath '.local/db-password' -Raw).Trim()
$env:PGPASSWORD = $localDatabasePassword
try {
    & $pgDump -h 127.0.0.1 -p 55432 -U chamjoeun -d chamjoeun -Fc -f $backupFile
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed' }
    Write-Output ('Backup created: ' + $backupFile)
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
# Local development helper. Production needs a daily scheduler, seven-day retention, separate encrypted storage, and restore checks.
