const $ = (id) => document.getElementById(id)
const $$ = (sel) => document.querySelectorAll(sel)

const API = 'https://ms-messenger-server.onrender.com/api/dashboard'

function fmt(n) { return Number(n || 0).toLocaleString('ru-RU') }

const PLATFORM_NAMES = { web: 'Web', android: 'Android', ios: 'iOS', desktop: 'PC' }

function setConn(cls, text) {
  const el = $('#conn-status')
  el.className = 'conn-status ' + cls
  $('#conn-text').textContent = text
}

async function load() {
  try {
    const r = await fetch(API, { signal: AbortSignal.timeout(10000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const d = await r.json()
    $('#err').classList.add('hidden')

    $('#online').textContent = d.onlineUsers
    $('#stat-users').textContent = fmt(d.totalUsers)
    $('#stat-today').textContent = fmt(d.newToday)
    $('#stat-week').textContent = fmt(d.newWeek)
    $('#stat-month').textContent = fmt(d.newMonth)
    $('#stat-msgs').textContent = fmt(d.totalMessages)

    renderChart(d.registrationsPerDay || [])
    renderPlatforms(d.platformStats || {})

    $('#last-update').textContent = 'обновлено ' + new Date().toLocaleTimeString('ru-RU')
    setConn('ok', 'Подключено')

    const up = d.uptime
    const upStr = up > 86400 ? Math.round(up / 86400) + ' дн.' : up > 3600 ? Math.round(up / 3600) + ' ч.' : Math.round(up / 60) + ' мин.'
    $('#footer').textContent = `Сервер: ${API.replace('/api/dashboard', '')} · аптайм ${upStr}`
  } catch (e) {
    $('#err').classList.remove('hidden')
    setConn('err', 'Нет связи с сервером')
  }
}

function renderChart(perDay) {
  const chart = $('#chart')
  const max = Math.max(1, ...perDay.map((d) => d.count))
  const total = perDay.reduce((a, d) => a + d.count, 0)
  $('#chart-total').textContent = total > 0 ? `${total} за месяц` : ''
  chart.innerHTML = perDay.map((d) => `
    <div class="bar" style="height:${Math.max(4, (d.count / max) * 100)}%">
      <span class="tip">${d.date}: ${d.count}</span>
    </div>
  `).join('')
}

function renderPlatforms(stats) {
  const entries = Object.entries(stats)
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  $('#platforms').innerHTML = entries.length
    ? entries.map(([k, v]) => `
        <div class="p-row">
          <span class="p-name">${PLATFORM_NAMES[k] || k}</span>
          <div class="p-track"><div class="p-fill" data-w="${(v / total) * 100}"></div></div>
          <span class="p-count">${fmt(v)}</span>
        </div>
      `).join('')
    : '<div style="color:#8a8aa0;font-size:13px">Нет данных</div>'
  requestAnimationFrame(() => {
    $$('.p-fill').forEach((f) => { f.style.width = f.dataset.w + '%' })
  })
}

$('#retry-btn').addEventListener('click', load)

load()
setInterval(load, 15000)
