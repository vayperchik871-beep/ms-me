const $ = (id) => document.getElementById(id.startsWith('#') ? id.slice(1) : id)
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
    setConn('wait', 'Сервер просыпается…')
    const r = await fetch(API, { signal: AbortSignal.timeout(60000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const d = await r.json()
    $('#err').classList.add('hidden')

    $('#online').textContent = d.onlineUsers
    $('#stat-users').textContent = fmt(d.totalUsers)
    $('#stat-today').textContent = fmt(d.newToday)
    $('#stat-week').textContent = fmt(d.newWeek)
    $('#stat-month').textContent = fmt(d.newMonth)
    $('#stat-msgs').textContent = fmt(d.totalMessages)
    $('#stat-msgs-today').textContent = fmt(d.messagesToday)
    $('#stat-chats').textContent = fmt(d.totalChats)
    $('#stat-chats-sub').textContent = 'групп и каналов: ' + fmt(d.groupsCount)
    $('#stat-avg').textContent = fmt(d.avgMsgPerUser)

    renderChart($('#chart'), $('#chart-total'), d.registrationsPerDay || [], (x) => x.date)
    renderChart($('#chart-hour'), $('#chart-hour-total'), d.activityByHour || [], (x) => `${x.hour}:00`, true)
    renderPlatforms(d.platformStats || {})
    renderPlatforms(d.onlineByPlatform || {}, $('#online-platforms'))
    renderTopChats(d.topChats || [])
    renderCountries(d.countryStats || [])

    $('#last-update').textContent = 'обновлено ' + new Date().toLocaleTimeString('ru-RU')
    setConn('ok', 'Подключено')

    const up = d.uptime
    const upStr = up > 86400 ? Math.round(up / 86400) + ' дн.' : up > 3600 ? Math.round(up / 3600) + ' ч.' : Math.round(up / 60) + ' мин.'
    $('#footer').textContent = `Сервер: ${API.replace('/api/dashboard', '')} · аптайм ${upStr}`
  } catch (e) {
    $('#err').classList.remove('hidden')
    setConn('err', 'Нет связи — повторяю…')
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

function renderCountries(countries) {
  const total = countries.reduce((a, c) => a + c.count, 0) || 1
  $('#countries').innerHTML = countries.length
    ? countries.map((c) => `
        <div class="p-row">
          <span class="p-name">${flagEmoji(c.code)} ${c.name}</span>
          <div class="p-track"><div class="p-fill" data-w="${(c.count / total) * 100}"></div></div>
          <span class="p-count">${fmt(c.count)}</span>
        </div>
      `).join('')
    : '<div style="color:#8a8aa0;font-size:13px">Страны определяются при регистрации</div>'
  requestAnimationFrame(() => {
    $$('#countries .p-fill').forEach((f) => { f.style.width = f.dataset.w + '%' })
  })
}

function flagEmoji(code) {
  if (!code || code.length !== 2) return ''
  const base = 127397
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => base + c.charCodeAt(0)))
}

$('#retry-btn').addEventListener('click', load)

load()
setInterval(load, 15000)
window.addEventListener('online', load)
window.addEventListener('focus', load)

// ─── Music moderation ───

const API_ROOT = 'https://ms-messenger-server.onrender.com'

function getAdminToken() {
  return ($('#admin-token').value || '').trim()
}

$('#music-refresh').addEventListener('click', loadMusicModeration)
$('#admin-token').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadMusicModeration() })

async function loadMusicModeration() {
  const token = getAdminToken()
  const el = $('#music-moderation')
  if (!token) {
    el.innerHTML = '<div style="color:#8a8aa0;font-size:13px;padding:8px">Введите admin token</div>'
    return
  }
  el.innerHTML = '<div style="color:#8a8aa0;font-size:13px;padding:8px">Загрузка…</div>'
  try {
    const res = await fetch(API_ROOT + '/api/admin/music/moderation', {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(30000),
    })
    if (res.status === 401 || res.status === 403) {
      el.innerHTML = '<div style="color:#ff453a;font-size:13px;padding:8px">Нет доступа — проверьте token</div>'
      return
    }
    const d = await res.json()
    renderModeration(d.tracks || [], token)
  } catch {
    el.innerHTML = '<div style="color:#ff453a;font-size:13px;padding:8px">Ошибка соединения</div>'
  }
}

function renderModeration(tracks, token) {
  const el = $('#music-moderation')
  if (!tracks.length) {
    el.innerHTML = '<div style="color:#8a8aa0;font-size:13px;padding:8px">Нет треков на модерации</div>'
    return
  }
  el.innerHTML = tracks.map((t) => `
    <div class="mod-track">
      <div class="mod-track-info">
        <div class="mod-track-title">${esc(t.title)}</div>
        <div class="mod-track-sub">${esc(t.artist)} · ${esc(t.format || 'mp3').toUpperCase()} · от ${esc(t.submitterHandle || '')}</div>
        <div class="mod-track-sub">${new Date(t.createdAt || Date.now()).toLocaleString('ru-RU')}</div>
      </div>
      <div class="mod-actions">
        <button class="btn-approve" onclick="reviewTrack('${t.id}','approve','${token}')">Принять</button>
        <button class="btn-reject" onclick="reviewTrack('${t.id}','reject','${token}')">Отклонить</button>
      </div>
    </div>
  `).join('')
}

async function reviewTrack(id, action, token) {
  const res = await fetch(API_ROOT + '/api/admin/music/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ trackId: id, action }),
  })
  if (res.ok) loadMusicModeration()
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
