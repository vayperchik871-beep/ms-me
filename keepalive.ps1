while ($true) {
    try {
        Invoke-WebRequest -Uri "https://ms-messenger-server.onrender.com/health" -TimeoutSec 10 -UseBasicParsing | Out-Null
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - OK"
    } catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - FAIL"
    }
    Start-Sleep -Seconds 540
}
