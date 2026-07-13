$dist='D:\петка\dist'
$assets1='D:\петка\android\app\src\main\assets\www'
$assets2='D:\петка\android\app\src\main\assets\public'

if(!(Test-Path $dist)){
    Write-Output 'NO_DIST'
    exit 0
}

$distCount=(Get-ChildItem -Path $dist -Recurse -File | Measure-Object).Count
$assetsPath = $assets1
if (!(Test-Path $assetsPath) -and (Test-Path $assets2)) { $assetsPath = $assets2 }
if (Test-Path $assetsPath) { $assetsCount=(Get-ChildItem -Path $assetsPath -Recurse -File | Measure-Object).Count } else { $assetsCount=0 }

Write-Output "DIST_COUNT:$distCount"
Write-Output "ASSETS_PATH:$assetsPath"
Write-Output "ASSETS_COUNT:$assetsCount"

Get-ChildItem -Path $dist -Recurse -File | ForEach-Object { $_.FullName.Substring($dist.Length+1) } | Set-Content -Path 'D:\петка\dist_list.txt' -Encoding utf8

if (Test-Path $assetsPath) {
    Get-ChildItem -Path $assetsPath -Recurse -File | ForEach-Object { $_.FullName.Substring($assetsPath.Length+1) } | Set-Content -Path 'D:\петка\assets_list.txt' -Encoding utf8
} else {
    Set-Content -Path 'D:\петка\assets_list.txt' -Value @() -Encoding utf8
}

$distFiles=Get-Content 'D:\петка\dist_list.txt'
$assetFiles=Get-Content 'D:\петка\assets_list.txt'
$comp=Compare-Object -ReferenceObject $distFiles -DifferenceObject $assetFiles
$onlyInDist=$comp | Where-Object { $_.SideIndicator -eq '<=' } | Select-Object -ExpandProperty InputObject
$onlyInAssets=$comp | Where-Object { $_.SideIndicator -eq '=>' } | Select-Object -ExpandProperty InputObject

Set-Content -Path 'D:\петка\dist_only.txt' -Value $onlyInDist -Encoding utf8
Set-Content -Path 'D:\петка\assets_only.txt' -Value $onlyInAssets -Encoding utf8

$summary = @()
$summary += "Dist count: $distCount"
$summary += "Assets path: $assetsPath"
$summary += "Assets count: $assetsCount"
$summary += "Only in dist (first 40):"
$summary += ($onlyInDist | Select-Object -First 40)
$summary += "Only in assets (first 40):"
$summary += ($onlyInAssets | Select-Object -First 40)
$summary | Out-File -FilePath 'D:\петка\compare_summary.txt' -Encoding utf8

Write-Output "COMPARE_DONE"
