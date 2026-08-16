param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("1", "2", "3", "4", "5", "6", "7", "8", "9")]
  [string]$Course
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist-course$Course"
$packagesDir = Join-Path $root "scorm-packages"


# Filename leads with the bag number so the 3 packages sort and scan
# correctly side by side in a folder -- "licensing-scorm2004.zip" reads
# fine alone but gives no clue which bag it is next to the other two
# without opening it.
$titleByCourse = @{
  "1" = "الحوكمة والمخاطر والامتثال"
  "2" = "إدارة الاستجابة للطوارئ"
  "3" = "ترخيص المنشآت الصحية والقوى العاملة"
  "4" = "إعداد السياسات والأنظمة واللوائح في القطاع الصحي"
  "5" = "حوكمة القطاع الصحي"
  "6" = "الجودة - مراقبة أداء النظام وإدارة حالات الإخفاق وحقوق المرضى"
  "7" = "الجودة - معايير وفحص ومراقبة وتحسين الجودة"
  "8" = "التحليل الاقتصادي والرعاية الصحية المبنية على القيمة"
  "9" = "التنظيم الاقتصادي - التنافسية والشفافية وآليات التسعير والدفع"
}
$title = $titleByCourse[$Course]
$finalName = "حقيبة $Course - $title - SCORM2004.zip"
$zip = Join-Path $packagesDir $finalName
# tar.exe on Windows doesn't reliably accept a non-ASCII destination path
# as a CLI argument (garbles to literal "?" characters and fails to open
# the file) -- write to a plain-ASCII temp name first, then rename to the
# real Arabic filename with Rename-Item, which goes through .NET's proper
# Unicode file APIs instead of a process argv string.
$tempZip = Join-Path $packagesDir "course$Course-scorm-temp.zip"

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
  if (Test-Path $tempZip) {
    Remove-Item -LiteralPath $tempZip -Force
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
  & $winTar -a -c -f $tempZip -C $dist .
  if ($LASTEXITCODE -ne 0) { throw "tar failed with exit code $LASTEXITCODE" }

  Move-Item -LiteralPath $tempZip -Destination $zip -Force

  $sizeMb = [Math]::Round((Get-Item $zip).Length / 1MB, 1)
  Write-Host "Course $Course SCORM package created: $zip ($sizeMb MB)"
}
finally {
  Pop-Location
}
