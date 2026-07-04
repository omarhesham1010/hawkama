Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$zip = Join-Path $root "governance-scorm2004.zip"

Push-Location $root
try {
  npm run build
  if (Test-Path $zip) {
    Remove-Item -LiteralPath $zip -Force
  }
  tar.exe -a -c -f $zip -C $dist .
  Write-Host "SCORM package created: $zip"
}
finally {
  Pop-Location
}
