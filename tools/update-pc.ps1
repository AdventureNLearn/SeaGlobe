<#
.SYNOPSIS
  Install a SeaGlobe release zip on this PC next to the copies you already have. Dry run unless you add -Apply.

.DESCRIPTION
  - Reads the release's version.json (a local file you downloaded, from tools/make_release.sh or the public site).
  - Checks the zip's SHA-256 against version.json's zip_sha256. A mismatch stops everything.
  - With -Apply, unpacks into <Root>\versions\<version>\ and writes <Root>\current.txt with that folder name.
    <Root> defaults to %LOCALAPPDATA%\SeaGlobe on Windows ($HOME/SeaGlobe elsewhere); pass -Root to choose another folder.
  - Never deletes or overwrites an installed version: an existing version folder is left as it is and the script stops.
    The only file it rewrites is the current.txt pointer.
    (The only thing it removes is its own empty staging folder from the same run.)
  - Makes no network requests. Download the zip and version.json yourself first.

.EXAMPLE
  pwsh tools/update-pc.ps1 -Zip .\seaglobe-3.0.0.zip -VersionJson .\version.json              # dry run: shows the plan
  pwsh tools/update-pc.ps1 -Zip .\seaglobe-3.0.0.zip -VersionJson .\version.json -Apply       # installs
  pwsh tools/update-pc.ps1 -Rollback 2.3.0 -Apply                                             # point current.txt back
#>
[CmdletBinding()]
param(
  [string]$Zip,
  [string]$VersionJson,
  [string]$Rollback,
  [string]$Root = $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'SeaGlobe' } else { Join-Path $HOME 'SeaGlobe' }),
  [switch]$Apply
)
$ErrorActionPreference = 'Stop'
function Say($m) { Write-Host "[SeaGlobe update] $m" }

$VersionPattern = '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$'
if ($Rollback) {   # switch back to a version that is already installed; nothing is unpacked or removed
  if ($Rollback -notmatch $VersionPattern -or $Rollback.Contains('..')) { throw "-Rollback must be a version like 2.3.0 (got '$Rollback')" }
  $back = Join-Path (Join-Path $Root 'versions') $Rollback
  if (-not (Test-Path -LiteralPath $back -PathType Container)) { throw "Version $Rollback is not installed under $Root\versions" }
  $cf = Join-Path $Root 'current.txt'
  $was = if (Test-Path -LiteralPath $cf) { (Get-Content -LiteralPath $cf -Raw).Trim() } else { '(none)' }
  Say "Rollback plan: current.txt $was -> $Rollback. All version folders stay."
  if (-not $Apply) { Say 'Dry run only. Add -Apply to switch.'; exit 0 }
  Set-Content -LiteralPath $cf -Value $Rollback -NoNewline
  Say "current.txt = $Rollback"
  exit 0
}
if (-not $Zip -or -not $VersionJson) { throw "Give -Zip and -VersionJson (or -Rollback <version>)" }
if (-not (Test-Path -LiteralPath $Zip -PathType Leaf)) { throw "Zip not found: $Zip" }
if (-not (Test-Path -LiteralPath $VersionJson -PathType Leaf)) { throw "version.json not found: $VersionJson" }
$meta = Get-Content -LiteralPath $VersionJson -Raw | ConvertFrom-Json
$version = [string]$meta.version
if ($version -notmatch $VersionPattern -or $version.Contains('..')) { throw "version.json has no valid version: '$version'" }
$expected = ([string]$meta.zip_sha256).ToLowerInvariant()
if ($expected -notmatch '^[0-9a-f]{64}$') { throw "version.json has no zip_sha256 (got '$expected'); use the stamped version.json from the release" }

$actual = (Get-FileHash -LiteralPath $Zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "SHA-256 mismatch: zip is $actual, version.json says $expected. Nothing was changed." }
Say "SHA-256 verified: $actual"

$versions = Join-Path $Root 'versions'
$target = Join-Path $versions $version
$currentFile = Join-Path $Root 'current.txt'
$current = if (Test-Path -LiteralPath $currentFile) { (Get-Content -LiteralPath $currentFile -Raw).Trim() } else { '(none)' }
Say "Installed now: $current"
Say "Release:       $version (commit $($meta.commit))"
if (Test-Path -LiteralPath $target) {
  Say "$target already exists. It is left untouched; nothing to do."
  exit 0
}
Say "Plan: unpack to $target and set current.txt to $version. Older versions stay where they are."
if (-not $Apply) { Say 'Dry run only. Add -Apply to install.'; exit 0 }

New-Item -ItemType Directory -Force -Path $versions | Out-Null
$staging = Join-Path $versions (".staging-$version-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
Expand-Archive -LiteralPath $Zip -DestinationPath $staging
# git archive puts everything under seaglobe/; move that folder into place in one step
$inner = Join-Path $staging 'seaglobe'
if (-not (Test-Path -LiteralPath $inner)) { throw "Zip has no seaglobe/ folder; staging left at $staging for inspection" }
Move-Item -LiteralPath $inner -Destination $target
# the staging folder is now empty and was made by this run; remove it only if it really is empty
if (-not (Get-ChildItem -LiteralPath $staging -Force)) { Remove-Item -LiteralPath $staging -Force }
Set-Content -LiteralPath $currentFile -Value $version -NoNewline
Copy-Item -LiteralPath $VersionJson -Destination (Join-Path $target 'release-version.json')
Say "Installed $version in $target. current.txt = $version. Previous: $current (kept)."
