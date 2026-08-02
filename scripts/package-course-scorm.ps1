param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("1", "2", "3")]
  [string]$Course
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist-course$Course"
$packagesDir = Join-Path $root "scorm-packages"

$slugByCourse = @{ "1" = "governance"; "2" = "emergency-response"; "3" = "licensing" }
$slug = $slugByCourse[$Course]
$zip = Join-Path $packagesDir "$slug-scorm2004.zip"

Push-Location $root
try {
  npm run "build:course$Course"
  if ($LASTEXITCODE -ne 0) { throw "build:course$Course failed with exit code $LASTEXITCODE" }

  if (-not (Test-Path $packagesDir)) {
    New-Item -ItemType Directory -Path $packagesDir | Out-Null
  }
  if (Test-Path $zip) {
    Remove-Item -LiteralPath $zip -Force
  }

  # tar (bundled with Windows since 1803) preserves the correct zip entry
  # structure for LMS import the same way package-scorm.ps1 already does
  # for the combined package -- Compress-Archive has been known to nest an
  # extra folder level some SCORM players choke on, so stay consistent
  # with the tool that's already proven to work. Called by full path,
  # not just "tar.exe" -- some shells (Git Bash's tar on PATH ahead of
  # System32) resolve to GNU tar instead, which doesn't understand a
  # Windows drive-letter path and fails with "Cannot connect to D:".
  $winTar = Join-Path $env:SystemRoot "System32\tar.exe"
  & $winTar -a -c -f $zip -C $dist .
  if ($LASTEXITCODE -ne 0) { throw "tar failed with exit code $LASTEXITCODE" }

  $sizeMb = [Math]::Round((Get-Item $zip).Length / 1MB, 1)
  Write-Host "Course $Course SCORM package created: $zip ($sizeMb MB)"
}
finally {
  Pop-Location
}
