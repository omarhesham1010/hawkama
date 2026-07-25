Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist-sample"
$zip = Join-Path $root "emergency-response-sample-slides-1-2-scorm2004.zip"

Push-Location $root
try {
  npm run build:sample
  if ($LASTEXITCODE -ne 0) { throw "build:sample failed with exit code $LASTEXITCODE" }
  if (Test-Path $zip) {
    Remove-Item -LiteralPath $zip -Force
  }
  Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $zip -Force
  Write-Host "Sample SCORM package created: $zip"
}
finally {
  Pop-Location
}
