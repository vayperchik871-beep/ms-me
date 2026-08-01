# MS Messenger — локальный keepalive
# Пингует сервер каждые 3 минуты, пока ПК включён.
# Таймаут 60с — дожидается cold start Render (обычно 20-30с).
$url = 'https://ms-messenger-server.onrender.com/health'

while ($true) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60
    Start-Sleep -Seconds 180
  } catch {
    Start-Sleep -Seconds 60
  }
}
