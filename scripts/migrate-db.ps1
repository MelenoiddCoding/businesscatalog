param(
    [string]$EnvPath = (Join-Path $PSScriptRoot '..\.env'),
    [string]$MigrationsPath = (Join-Path $PSScriptRoot '..\backend\migrations')
)

$ErrorActionPreference = 'Stop'

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = 'INFO'
    )

    switch ($Level) {
        'OK'    { Write-Host "[migrate-db] $Message" -ForegroundColor Green }
        'WARN'  { Write-Host "[migrate-db] $Message" -ForegroundColor Yellow }
        'ERROR' { Write-Host "[migrate-db] $Message" -ForegroundColor Red }
        default { Write-Host "[migrate-db] $Message" -ForegroundColor Cyan }
    }
}

function Read-EnvFile {
    param([string]$Path)

    $values = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        return $values
    }

    foreach ($rawLine in Get-Content -LiteralPath $Path) {
        $line = $rawLine.Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
            continue
        }

        if ($line -match '^(?<key>[A-Za-z_][A-Za-z0-9_]*)=(?<value>.*)$') {
            $key = $Matches.key
            $value = $Matches.value.Trim()
            if (
                ($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))
            ) {
                if ($value.Length -ge 2) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
            }
            $values[$key] = $value
        }
    }

    return $values
}

function Get-Setting {
    param(
        [hashtable]$Values,
        [string]$Name,
        [string]$Default = $null
    )

    if ($Values.ContainsKey($Name) -and -not [string]::IsNullOrWhiteSpace($Values[$Name])) {
        return $Values[$Name]
    }

    $envValue = [Environment]::GetEnvironmentVariable($Name)
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        return $envValue
    }

    return $Default
}

function Get-DatabaseUrlParts {
    param([string]$DatabaseUrl)

    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        return $null
    }

    $normalized = $DatabaseUrl -replace '^postgresql\+psycopg://', 'postgresql://'
    $uri = [System.Uri]::new($normalized)
    $userInfo = $uri.UserInfo.Split(':', 2)

    return [ordered]@{
        Host = $uri.Host
        Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        User = [Uri]::UnescapeDataString($userInfo[0])
        Password = if ($userInfo.Count -gt 1) { [Uri]::UnescapeDataString($userInfo[1]) } else { '' }
        Database = $uri.AbsolutePath.TrimStart('/')
    }
}

function Invoke-Psql {
    param(
        [string]$HostName,
        [int]$Port,
        [string]$UserName,
        [string]$Password,
        [string]$Database,
        [string]$Sql,
        [string]$FilePath = $null
    )

    $previousPassword = [Environment]::GetEnvironmentVariable('PGPASSWORD')
    try {
        if (-not [string]::IsNullOrWhiteSpace($Password)) {
            [Environment]::SetEnvironmentVariable('PGPASSWORD', $Password)
        }

        $arguments = @(
            '--host', $HostName,
            '--port', $Port,
            '--username', $UserName,
            '--dbname', $Database,
            '--no-psqlrc',
            '--tuples-only',
            '--no-align',
            '--quiet',
            '--set', 'ON_ERROR_STOP=1'
        )

        if ($FilePath) {
            $arguments += @('--file', $FilePath)
        }
        else {
            $arguments += @('--command', $Sql)
        }

        & psql @arguments
    }
    finally {
        [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPassword)
    }
}

if (-not (Test-Path -LiteralPath $MigrationsPath)) {
    throw "Migrations path not found: $MigrationsPath"
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    throw 'psql was not found in PATH. Install PostgreSQL client tools before running this script.'
}

$envValues = Read-EnvFile -Path $EnvPath
$databaseUrlParts = Get-DatabaseUrlParts -DatabaseUrl (Get-Setting -Values $envValues -Name 'DATABASE_URL')

$dbHost = Get-Setting -Values $envValues -Name 'POSTGRES_HOST' -Default $databaseUrlParts.Host
$port = [int](Get-Setting -Values $envValues -Name 'POSTGRES_PORT' -Default $databaseUrlParts.Port)
$user = Get-Setting -Values $envValues -Name 'POSTGRES_USER' -Default $databaseUrlParts.User
$password = Get-Setting -Values $envValues -Name 'POSTGRES_PASSWORD' -Default $databaseUrlParts.Password
$database = Get-Setting -Values $envValues -Name 'POSTGRES_DB' -Default $databaseUrlParts.Database

if ([string]::IsNullOrWhiteSpace($dbHost) -or [string]::IsNullOrWhiteSpace($user) -or [string]::IsNullOrWhiteSpace($database)) {
    throw 'Missing required database settings. Set POSTGRES_HOST, POSTGRES_USER and POSTGRES_DB or provide DATABASE_URL.'
}

Write-Log "Applying migrations to ${dbHost}:$port/$database"

$trackingSql = @"
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);
"@

Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database $database -Sql $trackingSql | Out-Null

$applied = @{}
$appliedRows = Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database $database -Sql "SELECT filename FROM schema_migrations ORDER BY filename;"
if ($appliedRows) {
    foreach ($row in ($appliedRows -split "`r?`n")) {
        $name = $row.Trim()
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            $applied[$name] = $true
        }
    }
}

$migrationFiles = Get-ChildItem -LiteralPath $MigrationsPath -File -Filter '*.sql' | Sort-Object Name

foreach ($migration in $migrationFiles) {
    if ($applied.ContainsKey($migration.Name)) {
        Write-Log "Skipping already applied migration $($migration.Name)" 'OK'
        continue
    }

    Write-Log "Applying $($migration.Name)"
    Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database $database -FilePath $migration.FullName | Out-Null
    Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database $database -Sql "INSERT INTO schema_migrations (filename) VALUES ('$($migration.Name)');" | Out-Null
    Write-Log "Applied $($migration.Name)" 'OK'
}

Write-Log 'All migrations applied successfully.' 'OK'
