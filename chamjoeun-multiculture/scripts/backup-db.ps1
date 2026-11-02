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
$databaseJson = @'
const u = new URL(process.env.DATABASE_URL);
if (!["127.0.0.1", "localhost"].includes(u.hostname)) throw new Error("Local backup helper requires a local database");
console.log(JSON.stringify({host:u.hostname,port:u.port||"5432",user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:decodeURIComponent(u.pathname.slice(1))}));
'@ | & node --env-file-if-exists=.env.local --input-type=module
$databaseConfig = $databaseJson | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $databaseConfig.database) { throw 'Cannot read local database configuration' }
$previousPgPassword = $env:PGPASSWORD
$env:PGPASSWORD = $databaseConfig.password
try {
    & $pgDump -h $databaseConfig.host -p $databaseConfig.port -U $databaseConfig.user -d $databaseConfig.database -Fc -f $backupFile
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed' }
    Write-Output ('Backup created: ' + $backupFile)
} finally {
    if ($null -eq $previousPgPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    else { $env:PGPASSWORD = $previousPgPassword }
}
# Local development helper. Production needs a daily scheduler, seven-day retention, separate encrypted storage, and restore checks.
