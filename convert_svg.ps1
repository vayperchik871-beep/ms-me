# Blue badge SVG path - convert to Android VectorDrawable
# Transform: translate(0,359) scale(0.1,-0.1)
# x' = x * 0.1, y' = 359 - y * 0.1

function Convert-SVGPath {
    param([string]$path)
    
    # Parse path into tokens
    $tokens = $path -split '(?=[MmZzLlHhVvCcSsQqTtAa])' | Where-Object { $_.Trim() -ne '' }
    
    $absX = 0; $absY = 0
    $result = @()
    
    foreach ($token in $tokens) {
        $token = $token.Trim()
        if ($token.Length -eq 0) { continue }
        
        $cmd = $token[0]
        $nums = ($token.Substring(1) -replace ',', ' ' -replace '\s+', ' ').Trim() -split ' ' | Where-Object { $_ -ne '' } | ForEach-Object { [double]$_ }
        
        switch ($cmd) {
            'M' {
                for ($i = 0; $i -lt $nums.Count; $i += 2) {
                    $x = $nums[$i]; $y = $nums[$i+1]
                    $absX = $x; $absY = $y
                    $tx = $x * 0.1; $ty = 359 - $y * 0.1
                    $result += "M$([math]::Round($tx,1)),$([math]::Round($ty,1))"
                }
            }
            'm' {
                for ($i = 0; $i -lt $nums.Count; $i += 2) {
                    $absX += $nums[$i]; $absY += $nums[$i+1]
                    $tx = $absX * 0.1; $ty = 359 - $absY * 0.1
                    $result += "M$([math]::Round($tx,1)),$([math]::Round($ty,1))"
                }
            }
            'l' {
                for ($i = 0; $i -lt $nums.Count; $i += 2) {
                    $absX += $nums[$i]; $absY += $nums[$i+1]
                    $tx = $absX * 0.1; $ty = 359 - $absY * 0.1
                    $result += "L$([math]::Round($tx,1)),$([math]::Round($ty,1))"
                }
            }
            'c' {
                for ($i = 0; $i -lt $nums.Count; $i += 6) {
                    $x1 = $absX + $nums[$i]; $y1 = $absY + $nums[$i+1]
                    $x2 = $absX + $nums[$i+2]; $y2 = $absY + $nums[$i+3]
                    $x = $absX + $nums[$i+4]; $y = $absY + $nums[$i+5]
                    $absX = $x; $absY = $y
                    $tx1 = $x1 * 0.1; $ty1 = 359 - $y1 * 0.1
                    $tx2 = $x2 * 0.1; $ty2 = 359 - $y2 * 0.1
                    $tx = $x * 0.1; $ty = 359 - $y * 0.1
                    $result += "C$([math]::Round($tx1,1)),$([math]::Round($ty1,1)) $([math]::Round($tx2,1)),$([math]::Round($ty2,1)) $([math]::Round($tx,1)),$([math]::Round($ty,1))"
                }
            }
            'z' { $result += "Z" }
        }
    }
    return ($result -join ' ')
}

$blue = Get-Content "D:\петка\badge_blue.png" -Raw
$bluePath = [regex]::Match($blue, 'd="([^"]+)"').Groups[1].Value -replace "`n", " " -replace "`r", "" -replace '\s+', ' '

$black = Get-Content "D:\петка\badge_black.png" -Raw
$blackPath = [regex]::Match($black, 'd="([^"]+)"').Groups[1].Value -replace "`n", " " -replace "`r", "" -replace '\s+', ' '

Write-Output "=== BLUE CONVERTED ==="
Convert-SVGPath $bluePath
Write-Output ""
Write-Output "=== BLACK CONVERTED ==="
Convert-SVGPath $blackPath
