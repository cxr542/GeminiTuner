# Build Chrome Web Store upload ZIP (extension files only, root-level manifest)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$zipPath = Join-Path $dist 'GeminiTuner-v1.0.6.zip'

$icon128 = Join-Path $root 'icons\icon128.png'
if (-not (Test-Path $icon128)) {
    Write-Host 'Icons missing. Running generate-icons.ps1 ...'
    & (Join-Path $PSScriptRoot 'generate-icons.ps1')
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$staging = Join-Path $env:TEMP "gemini-tuner-store-$(Get-Random)"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$files = @(
    'manifest.json',
    'page-hook.js',
    'background.js',
    'dom-meter.js',
    'currency.js',
    'api-usage.js',
    'aistudio-sync.js',
    'content.js',
    'styles.css',
    'popup.html',
    'popup.js'
)
foreach ($f in $files) {
    Copy-Item (Join-Path $root $f) (Join-Path $staging $f)
}

$iconDir = Join-Path $staging 'icons'
New-Item -ItemType Directory -Path $iconDir | Out-Null
foreach ($s in @(16, 32, 48, 128)) {
    Copy-Item (Join-Path $root "icons\icon$s.png") (Join-Path $iconDir "icon$s.png")
}

Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

Write-Host ''
Write-Host "Store package ready: $zipPath"
Write-Host 'Upload this ZIP at https://chrome.google.com/webstore/devconsole'
