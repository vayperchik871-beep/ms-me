# MS Messenger — локальный keepalive (надёжно)
# Пингует сервер каждые 90 секунд, пока ПК включён.
# Логирует результаты в keepalive.log

$url = 'https://ms-messenger-server.onrender.com/health'
$log = Join-Path $PSScriptRoot 'keepalive.log'
$interval = 90

Write-Host "MS Messenger Keepalive started. Ping every ${interval}s" -ForegroundColor Green
Write-Host "Log: $log"

while ($true) {
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    try {
        $resp = curl.exe -s --max-time 30 $url 2>$null
        if ($resp -match '"ok":true') {
            $msg = "[$ts] OK"
            Write-Host $msg -ForegroundColor Green
        } else {
            $msg = "[$ts] WARN: $resp"
            Write-Host $msg -ForegroundColor Yellow
        }
    } catch {
        $msg = "[$ts] FAIL: $_"
        Write-Host $msg -ForegroundColor Red
    }
    Add-Content -Path $log -Value $msg
    Start-Sleep -Seconds $interval
}
