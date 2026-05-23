# Configures a linked Railway service for PixelProject (volume, env vars, domain).
# Usage:
#   .\scripts\railway-setup.ps1
#   .\scripts\railway-setup.ps1 -ProjectId "your-project-id"
# Requires: railway CLI logged in, or RAILWAY_TOKEN / RAILWAY_API_TOKEN set.

param(
  [string]$ProjectId = "",
  [string]$ServiceName = "",
  [switch]$SkipDomain
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Test-RailwayAuth {
  railway whoami 2>$null
  return $LASTEXITCODE -eq 0
}

function New-RandomSecret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes)
}

function Ensure-SecretsFile {
  $secretsPath = Join-Path $Root ".env.railway.setup"
  if (Test-Path $secretsPath) {
    return $secretsPath
  }

  $admin = New-RandomSecret
  $master = New-RandomSecret
  @(
    "# Generated for Railway — copy these to Railway Variables if not using this script."
    "ADMIN_SECRET=$admin"
    "MASTER_ENCRYPTION_KEY=$master"
    "NODE_ENV=production"
  ) | Set-Content -Path $secretsPath -Encoding utf8

  Write-Host "Created $secretsPath with generated secrets."
  return $secretsPath
}

function Read-Secrets {
  param([string]$Path)
  $vars = @{}
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $vars[$name.Trim()] = $value.Trim()
  }
  return $vars
}

if (-not (Test-RailwayAuth)) {
  Write-Host "Not logged in to Railway."
  Write-Host "Option A: run  railway login  in a terminal and complete browser auth."
  Write-Host "Option B: create a token at https://railway.app/account/tokens and run:"
  Write-Host '  $env:RAILWAY_TOKEN = "your-token"'
  Write-Host "  .\scripts\railway-setup.ps1"
  exit 1
}

Write-Host ("Logged in as: " + (railway whoami))

if ($ProjectId) {
  railway link -p $ProjectId
} elseif (-not (Test-Path (Join-Path $Root ".railway"))) {
  Write-Host "Linking project (select PixelProject in the prompt)..."
  railway link
}

$secretsPath = Ensure-SecretsFile
$secrets = Read-Secrets $secretsPath

Write-Host "Setting environment variables..."
foreach ($key in @("ADMIN_SECRET", "MASTER_ENCRYPTION_KEY", "NODE_ENV")) {
  if (-not $secrets.ContainsKey($key)) { continue }
  railway variable set "${key}=$($secrets[$key])" --skip-deploys
}

$volumesJson = railway volume list --json 2>$null
$hasDataVolume = $false
if ($volumesJson) {
  $volumes = $volumesJson | ConvertFrom-Json
  foreach ($vol in $volumes) {
    if ($vol.mountPath -eq "/app/data") {
      $hasDataVolume = $true
      break
    }
  }
}

if (-not $hasDataVolume) {
  Write-Host "Adding 1 GB volume at /app/data..."
  railway volume add --mount-path /app/data
} else {
  Write-Host "Volume already mounted at /app/data."
}

if (-not $SkipDomain) {
  Write-Host "Generating public Railway domain..."
  railway domain --json 2>$null | Out-Null
}

Write-Host "Redeploying..."
railway up --detach 2>$null
if ($LASTEXITCODE -ne 0) {
  railway redeploy --yes 2>$null
}

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. Open your Railway domain (Settings -> Networking if needed)"
Write-Host "  2. Visit /admin and sign in with ADMIN_SECRET from .env.railway.setup"
Write-Host "  3. Upload your 1000x1000 hidden image"
Write-Host "  4. Buy a test pixel on the homepage"
