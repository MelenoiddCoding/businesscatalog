param(
    [string]$EnvPath = (Join-Path $PSScriptRoot '..\.env')
)

$ErrorActionPreference = 'Stop'

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = 'INFO'
    )

    switch ($Level) {
        'OK'    { Write-Host "[bootstrap-db] $Message" -ForegroundColor Green }
        'WARN'  { Write-Host "[bootstrap-db] $Message" -ForegroundColor Yellow }
        'ERROR' { Write-Host "[bootstrap-db] $Message" -ForegroundColor Red }
        default { Write-Host "[bootstrap-db] $Message" -ForegroundColor Cyan }
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

    $parts = [ordered]@{
        Host     = $uri.Host
        Port     = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        User     = [Uri]::UnescapeDataString($userInfo[0])
        Password = if ($userInfo.Count -gt 1) { [Uri]::UnescapeDataString($userInfo[1]) } else { '' }
        Database = $uri.AbsolutePath.TrimStart('/')
    }

    return $parts
}

function Escape-SqlIdentifier {
    param([string]$Value)
    return '"' + ($Value -replace '"', '""') + '"'
}

function Escape-SqlLiteral {
    param([string]$Value)
    return "'" + ($Value -replace "'", "''") + "'"
}

function Invoke-Psql {
    param(
        [string]$HostName,
        [int]$Port,
        [string]$UserName,
        [string]$Password,
        [string]$Database,
        [string]$Sql
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
            '--set', 'ON_ERROR_STOP=1',
            '--command', $Sql
        )

        & psql @arguments
    }
    finally {
        [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPassword)
    }
}

$envValues = Read-EnvFile -Path $EnvPath
$databaseUrlParts = Get-DatabaseUrlParts -DatabaseUrl (Get-Setting -Values $envValues -Name 'DATABASE_URL')

$dbHost = Get-Setting -Values $envValues -Name 'POSTGRES_HOST' -Default $databaseUrlParts.Host
$portValue = Get-Setting -Values $envValues -Name 'POSTGRES_PORT' -Default $databaseUrlParts.Port
$port = [int]$portValue
$user = Get-Setting -Values $envValues -Name 'POSTGRES_USER' -Default $databaseUrlParts.User
$password = Get-Setting -Values $envValues -Name 'POSTGRES_PASSWORD' -Default $databaseUrlParts.Password
$database = Get-Setting -Values $envValues -Name 'POSTGRES_DB' -Default $databaseUrlParts.Database

if ([string]::IsNullOrWhiteSpace($dbHost) -or [string]::IsNullOrWhiteSpace($user) -or [string]::IsNullOrWhiteSpace($database)) {
    throw 'Missing required database settings. Set POSTGRES_HOST, POSTGRES_USER and POSTGRES_DB or provide DATABASE_URL.'
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    throw 'psql was not found in PATH. Install PostgreSQL client tools before running this script.'
}

Write-Log "Target database: $database on ${dbHost}:$port"

$safeDatabaseLiteral = Escape-SqlLiteral -Value $database
$checkSql = "SELECT 1 FROM pg_database WHERE datname = $safeDatabaseLiteral;"
$existing = Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database 'postgres' -Sql $checkSql

if ($existing -match '1') {
    Write-Log 'Database already exists.' 'OK'
}
else {
    Write-Log 'Database does not exist. Creating it now.' 'WARN'
    $createSql = "CREATE DATABASE $(Escape-SqlIdentifier -Value $database);"
    Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database 'postgres' -Sql $createSql | Out-Null
    Write-Log 'Database created.' 'OK'
}

$extensionSql = @(
    'CREATE EXTENSION IF NOT EXISTS postgis;'
    'CREATE EXTENSION IF NOT EXISTS citext;'
) -join ' '

Invoke-Psql -HostName $dbHost -Port $port -UserName $user -Password $password -Database $database -Sql $extensionSql | Out-Null
Write-Log 'Extensions ensured: postgis, citext' 'OK'

Write-Log 'Bootstrap completed successfully.' 'OK'
