const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => document.querySelectorAll(sel)

const DEFAULT_SERVER = 'https://ms-messenger-server.onrender.com'
const state = {
  token: null,
  server: localStorage.getItem('msAdminServer') || DEFAULT_SERVER,
  stats: null,
  users: [],
  filter: 'all',
  search: '',
  refreshTimer: null,
}

function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`
  return fetch(`${state.server}${path}`, { ...options, headers }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || `Ошибка ${r.status}`)
    return data
  })
}

// ─── Login ───
$('#login-btn').addEventListener('click', doLogin)
for (const id of ['login-server', 'login-user', 'login-pass']) {
  $(`#${id}`).addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin() })
}

async function doLogin() {
  const server = $('#login-server').value.trim().replace(/\/+$/, '')
  const userId = $('#login-user').value.trim()
  const password = $('#login-pass').value
  const err = $('#login-error')
  err.textContent = ''

  if (!server || !userId || !password) {
    err.textContent = 'Заполните все поля'
    return
  }

  const btn = $('#login-btn')
  btn.disabled = true
  btn.textContent = 'Вход…'

  try {
    const data = await fetch(`${server}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-app': 'true' },
      body: JSON.stringify({ userId, password, deviceId: 'admin-dashboard-pc', platform: 'desktop-admin' }),
    }).then(async (r) => {
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || `Ошибка ${r.status}`)
      return d
    })

    state.token = data.token
    state.server = server
    localStorage.setItem('msAdminToken', data.token)
    localStorage.setItem('msAdminServer', server)

    const me = await api('/api/auth/me').catch(() => null)
    if (!me?.user?.isAdmin) throw new Error('Нет прав администратора')

    showApp(me.user)
    startRefresh()
  } catch (e) {
    err.textContent = e.message || 'Ошибка входа'
    setConn('err', 'Ошибка входа')
  } finally {
    btn.disabled = false
    btn.textContent = 'Войти'
  }
}

$('#logout-btn').addEventListener('click', () => {
  state.token = null
  localStorage.removeItem('msAdminToken')
  stopRefresh()
  $('#app-screen').classList.add('hidden')
  $('#login-screen').classList.remove('hidden')
  $('#login-pass').value = ''
  setConn('off', 'Не подключено')
})

// ─── Navigation ───
$$('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    $$('.view').forEach((v) => v.classList.add('hidden'))
    $('#view-' + btn.dataset.view).classList.remove('hidden')
    const titles = { overview: 'Обзор', users: 'Пользователи', terminal: 'Терминал' }
    $('#view-title').textContent = titles[btn.dataset.view]
    $('#view-sub').textContent = btn.dataset.view === 'overview' ? 'Статистика сервера MS Messenger' : ''
  })
})

// ─── Refresh ───
function startRefresh() {
  refreshAll()
  state.refreshTimer = setInterval(refreshAll, 10000)
}

function stopRefresh() {
  if (state.refreshTimer) { clearInterval(state.refreshTimer); state.refreshTimer = null }
}

let refreshing = false
async function refreshAll() {
  if (refreshing) return
  refreshing = true
  try {
    const [stats, users] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/users'),
    ])
    state.stats = stats
    state.users = users.users || []
    renderStats()
    renderUsers()
    renderPlatforms()
    $('#nav-users-count').textContent = state.users.length
    $('#nav-users-count').classList.remove('hidden')
    $('#last-update').textContent = `Обновлено ${new Date().toLocaleTimeString('ru-RU')}`
    setConn('ok', 'Подключено')
  } catch (e) {
    setConn('err', 'Нет связи с сервером')
  } finally {
    refreshing = false
  }
}

$('#refresh-btn').addEventListener('click', refreshAll)

function setConn(cls, text) {
  const el = $('#conn-status')
  el.className = 'conn-status ' + cls
  $('#conn-text').textContent = text
}

// ─── Stats ───
function renderStats() {
  const s = state.stats
  if (!s) return
  $('#stat-users').textContent = fmt(s.totalUsers)
  $('#stat-reg-today').textContent = `+${s.registrationsToday} сегодня`
  $('#stat-online').textContent = fmt(s.onlineUsers)
  $('#stat-msg-today').textContent = fmt(s.messagesToday)
  $('#stat-msg-total').textContent = `${fmt(s.totalMessages)} всего`
  $('#stat-chats').textContent = fmt(s.totalChats)
  $('#stat-groups').textContent = `${s.groupsCount} групп/каналов`
  $('#stat-banned').textContent = fmt(s.bannedUsers)
  const scamPart = s.scamUsers > 0 ? `${s.scamUsers} скам` : 'чисто'
  $('#stat-scam').textContent = scamPart
  $('#stat-bots').textContent = fmt(s.botsCount)
  const plat = Object.entries(s.platformStats || {}).map(([k, v]) => `${cap(k)} ${v}`).join(' · ')
  $('#stat-platforms').textContent = plat || '—'
}

const PLATFORM_NAMES = { web: 'Web', android: 'Android', ios: 'iOS', desktop: 'PC', 'desktop-admin': 'PC' }

function renderPlatforms() {
  const s = state.stats
  if (!s) return
  const entries = Object.entries(s.platformStats || {})
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  const box = $('#platform-bars')
  box.innerHTML = ''
  if (entries.length === 0) {
    box.innerHTML = '<div class="platform-top"><span class="p-name">Нет данных</span></div>'
    return
  }
  for (const [key, count] of entries) {
    const row = document.createElement('div')
    row.className = 'platform-row'
    row.innerHTML = `
      <div class="platform-top">
        <span class="p-name">${PLATFORM_NAMES[key] || cap(key)}</span>
        <span class="p-count">${fmt(count)}</span>
      </div>
      <div class="platform-track"><div class="platform-fill" data-w="${(count / total) * 100}"></div></div>
    `
    box.appendChild(row)
  }
  requestAnimationFrame(() => {
    $$('.platform-fill').forEach((f) => { f.style.width = f.dataset.w + '%' })
  })
}

// ─── Users ───
$('#user-search').addEventListener('input', (e) => { state.search = e.target.value.toLowerCase(); renderUsers() })
$('#user-filter').addEventListener('change', (e) => { state.filter = e.target.value; renderUsers() })

function renderUsers() {
  const tbody = $('#users-tbody')
  let users = state.users

  if (state.filter === 'online') users = users.filter((u) => u.online)
  if (state.filter === 'banned') users = users.filter((u) => u.banned)
  if (state.filter === 'scam') users = users.filter((u) => u.scam)
  if (state.filter === 'premium') users = users.filter((u) => u.premium)

  if (state.search) {
    users = users.filter((u) =>
      (u.userId || '').toLowerCase().includes(state.search) ||
      (u.name || '').toLowerCase().includes(state.search)
    )
  }

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Никого не найдено</td></tr>'
    return
  }

  tbody.innerHTML = users.map((u) => {
    const online = !!u.online
    const badges = []
    if (online) badges.push('<span class="badge online">● Онлайн</span>')
    else badges.push('<span class="badge offline">○ Офлайн</span>')
    if (u.banned) badges.push('<span class="badge banned">Бан</span>')
    if (u.scam) badges.push('<span class="badge scam">Скам</span>')
    if (u.premium) badges.push(`<span class="badge premium">${u.premium === 'pro' ? 'Pro' : 'Plus'}</span>`)
    if (u.isAdmin) badges.push('<span class="badge admin">Админ</span>')

    const initial = (u.name || '?').trim().charAt(0).toUpperCase()
    const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—'

    return `
      <tr class="${online ? '' : 'offline-row'}" data-uid="${esc(u.userId)}">
        <td>
          <div class="u-cell">
            <div class="u-avatar">${esc(initial)}</div>
            <div>
              <div class="u-name">${esc(u.name)}</div>
              <div class="u-id">${esc(u.userId)}</div>
            </div>
          </div>
        </td>
        <td class="td-plat">${esc(u.userId)}</td>
        <td><div class="badge-row">${badges.join('')}</div></td>
        <td class="td-plat">${PLATFORM_NAMES[u.platform] || cap(u.platform) || '—'}</td>
        <td class="td-plat">${u.premium ? u.premium : '—'}</td>
        <td class="td-date">${date}</td>
        <td class="th-actions"><div class="row-actions">
          <button class="act-btn ${u.banned ? '' : 'ban'}" data-act="ban" ${u.banned ? 'title="Разбанить"' : 'title="Забанить"'} data-uid="${esc(u.userId)}" data-val="${u.banned ? '0' : '1'}">${u.banned ? 'Разбан' : 'Бан'}</button>
          <button class="act-btn ${u.scam ? '' : 'scam'}" data-act="scam" title="Скам" data-uid="${esc(u.userId)}" data-val="${u.scam ? '0' : '1'}">${u.scam ? 'Снять скам' : 'Скам'}</button>
          <button class="act-btn grant" data-act="promote" title="Админ" data-uid="${esc(u.userId)}" data-val="${u.isAdmin ? '0' : '1'}">${u.isAdmin ? 'Снять админа' : 'В админы'}</button>
          <button class="act-btn del" data-act="delete" title="Удалить" data-uid="${esc(u.userId)}">Удалить</button>
        </div></td>
      </tr>
    `
  }).join('')
}

$('#users-tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('.act-btn')
  if (!btn) return
  const { act, uid, val } = btn.dataset

  if (act === 'delete') {
    if (!confirm(`Удалить пользователя ${uid} и все его данные?`)) return
    btn.disabled = true
    try {
      const r = await api('/api/admin/command', {
        method: 'POST',
        body: JSON.stringify({ command: `delete ${uid}` }),
      })
      toast(r.output || 'Удалён', 'ok')
      refreshAll()
    } catch (err) { toast(err.message, 'err') }
    return
  }

  btn.disabled = true
  try {
    if (act === 'ban') {
      await api('/api/admin/ban', { method: 'POST', body: JSON.stringify({ userId: uid, value: val === '1' }) })
      toast(val === '1' ? `Забанен: ${uid}` : `Разбанен: ${uid}`, 'ok')
    } else if (act === 'scam') {
      const r = await api('/api/admin/scam', { method: 'POST', body: JSON.stringify({ userId: uid, value: val === '1' }) })
      toast(val === '1' ? `Помечен как скам: ${uid}` : `Метка снята: ${uid}`, 'ok')
      if (r.name) btn.closest('tr').querySelector('.u-name').textContent = r.name
    } else if (act === 'promote') {
      await api('/api/admin/command', {
        method: 'POST',
        body: JSON.stringify({ command: val === '1' ? `promote ${uid}` : `demote ${uid}` }),
      })
      toast(val === '1' ? `Админ: ${uid}` : `Админ-права сняты: ${uid}`, 'ok')
    }
    refreshAll()
  } catch (err) { toast(err.message, 'err') }
})

// ─── Terminal ───
const termOutput = $('#term-output')

function termPrint(text, cls = 'info') {
  for (const line of String(text).split('\n')) {
    const div = document.createElement('div')
    div.className = `term-line ${cls}`
    div.textContent = line || ' '
    termOutput.appendChild(div)
  }
  termOutput.scrollTop = termOutput.scrollHeight
}

function termBanner() {
  termPrint('MS Messenger — серверный терминал', 'help')
  termPrint('Введите help для списка команд', 'help')
  termPrint('')
}

const termInput = $('#term-input')
termInput.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return
  const cmd = termInput.value.trim()
  if (!cmd) return
  termInput.value = ''
  termPrint(`admin> ${cmd}`, 'cmd')
  if (cmd.toLowerCase() === 'clear') {
    termOutput.innerHTML = ''
    termBanner()
    return
  }
  try {
    const r = await api('/api/admin/command', { method: 'POST', body: JSON.stringify({ command: cmd }) })
    const out = r.output || '—'
    termPrint(out, out.toLowerCase().includes('ошибк') || out.toLowerCase().includes('error') || out.toLowerCase().includes('неверн') ? 'err' : 'ok')
  } catch (err) {
    termPrint(`Ошибка: ${err.message}`, 'err')
  }
})

// ─── Utils ───
function showApp(user) {
  $('#login-screen').classList.add('hidden')
  $('#app-screen').classList.remove('hidden')
  $('#view-sub').textContent = `Вы вошли как ${user.name || user.userId}`
  setConn('ok', 'Подключено')
}

function fmt(n) { return Number(n || 0).toLocaleString('ru-RU') }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }

let toastTimer = null
function toast(text, cls = '') {
  const el = $('#toast')
  el.textContent = text
  el.className = `toast ${cls}`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500)
}

// ─── Init ───
termBanner()

const savedToken = localStorage.getItem('msAdminToken')
const savedServer = localStorage.getItem('msAdminServer')
if (savedToken && savedServer) {
  state.token = savedToken
  state.server = savedServer
  $('#login-server').value = savedServer
  api('/api/auth/me').then((me) => {
    if (me?.user?.isAdmin) {
      showApp(me.user)
      startRefresh()
    } else {
      throw new Error('no-admin')
    }
  }).catch(() => {
    state.token = null
    localStorage.removeItem('msAdminToken')
    setConn('off', 'Не подключено')
  })
} else {
  setConn('off', 'Не подключено')
}
