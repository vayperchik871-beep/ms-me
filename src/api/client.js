function getApiBase() {
  if (typeof window === 'undefined') return '/api'

  const configured = (import.meta.env?.VITE_API_BASE_URL || '').trim()
  if (configured) return configured.replace(/\/$/, '')

  const isNative = window.location.protocol === 'file:' || window.Capacitor?.isNativePlatform?.()
  if (isNative) return 'https://ms-messenger-server.onrender.com'

  return '/api'
}

function getApiUrl(path = '') {
  const base = getApiBase()
  if (base === '/api') return `/api${path}`
  return `${base}/api${path}`
}

export function getToken() {
  const acc = getActiveAccount()
  return acc?.token || null
}

export function getDeviceId() {
  let id = localStorage.getItem('ms_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ms_device_id', id)
  }
  return id
}

export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem('ms_accounts') || '[]')
  } catch {
    return []
  }
}

export function saveAccount(account) {
  const accounts = getAccounts().filter((a) => a.userId !== account.userId)
  accounts.unshift(account)
  localStorage.setItem('ms_accounts', JSON.stringify(accounts.slice(0, 2)))
  localStorage.setItem('ms_active_account', account.userId)
}

export function getActiveAccount() {
  const activeId = localStorage.getItem('ms_active_account')
  const accounts = getAccounts()
  return accounts.find((a) => a.userId === activeId) || accounts[0] || null
}

export function switchAccount(userId) {
  localStorage.setItem('ms_active_account', userId)
}

export function canAddAccount() {
  return getAccounts().length < 2
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  if (import.meta.env?.VITE_ADMIN_MODE === 'true') headers['X-Admin-App'] = 'true'

  const res = await fetch(getApiUrl(path), { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data
}

async function upload(path, field, file, extra = {}) {
  const token = getToken()
  const form = new FormData()
  form.append(field, file)
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (import.meta.env?.VITE_ADMIN_MODE === 'true') headers['X-Admin-App'] = 'true'
  const res = await fetch(getApiUrl(path), { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки')
  return data
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  verifyDevice: (body) => request('/auth/verify-device', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getUser: (userId) => request(`/users/${userId}`),
  getContacts: () => request('/contacts'),
  addContact: (userId) => request('/contacts', { method: 'POST', body: JSON.stringify({ userId }) }),
  getChats: () => request('/chats'),
  getMessages: (chatId) => request(`/chats/${chatId}/messages`),
  sendMessage: (chatId, text, replyTo, attachment) =>
    request(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text, replyTo, attachment }) }),
  editMessage: (id, text) => request(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  deleteMessage: (id) => request(`/messages/${id}`, { method: 'DELETE' }),
  pinMessage: (id) => request(`/messages/${id}/pin`, { method: 'POST' }),
  reactMessage: (id, emoji) => request(`/messages/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  favoriteMessage: (id) => request(`/messages/${id}/favorite`, { method: 'POST' }),
  readChat: (chatId) => request(`/chats/${chatId}/read`, { method: 'POST' }),
  uploadAvatar: (file) => upload('/upload/avatar', 'avatar', file),
  uploadAttachment: (file, duration) => upload('/upload/attachment', 'file', file, duration ? { duration } : {}),
  updateAvatar: (url) => request('/users/avatar', { method: 'PATCH', body: JSON.stringify({ avatar: url }) }),

  // Admin
  adminStats: () => request('/admin/stats'),
  adminUsers: () => request('/admin/users'),
  adminBan: (userId, value) => request('/admin/ban', { method: 'POST', body: JSON.stringify({ userId, value }) }),
  adminScam: (userId, value) => request('/admin/scam', { method: 'POST', body: JSON.stringify({ userId, value }) }),
  adminCommand: (command) => request('/admin/command', { method: 'POST', body: JSON.stringify({ command }) }),

  // Profile
  updateProfile: (body) => request('/user/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Google Auth
  googleAuth: (body) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
}

export function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith('https://') || url.startsWith('data:')) return url
  const base = getApiBase()
  if (url.startsWith('http://')) {
    if (base && url.startsWith(base.replace(/^https:/i, 'http:'))) {
      return url.replace(/^http:/i, 'https:')
    }
    return url
  }
  if (base === '/api') return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export function getWsUrl() {
  const token = getToken()
  if (!token) return null

  const configured = (import.meta.env?.VITE_API_BASE_URL || '').trim()
  if (configured) {
    const base = configured.replace(/\/$/, '')
    const wsBase = base.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://')
    return `${wsBase}/ws?token=${token}`
  }

  const isNative = window.location.protocol === 'file:' || window.Capacitor?.isNativePlatform?.()
  if (isNative) {
    return `wss://ms-messenger-server.onrender.com/ws?token=${token}`
  }

  return `/ws?token=${token}`
}
