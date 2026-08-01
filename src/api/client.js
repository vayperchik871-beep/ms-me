export function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || ''
}

function getApiUrl(path = '') {
  if (window.Capacitor?.isNativePlatform?.()) {
    return `https://ms-messenger-server.onrender.com/api${path}`
  }
  return `/api${path}`
}

let _tempToken = null

export function setToken(token) {
  _tempToken = token
}

export function getToken() {
  if (_tempToken) return _tempToken
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

export function getPlatform() {
  if (window.Capacitor?.isNativePlatform?.()) {
    const ua = navigator.userAgent || ''
    if (ua.includes('Android')) return 'android'
    return 'ios'
  }
  if (window.electron || navigator.userAgent.includes('Electron')) return 'desktop'
  return 'web'
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
  return true
}

async function requestWithRetry(url, options, retries = 2, delay = 1500) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      return res
    } catch (err) {
      clearTimeout(timer)
      if (i < retries) {
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const url = getApiUrl(path)
  try {
    const res = await requestWithRetry(url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
    return data
  } catch (err) {
    console.error('API request failed:', url, err)
    throw new Error(`Ошибка подключения (${url}): ${err.message}`)
  }
}

async function upload(path, field, file, extra = {}) {
  const token = getToken()
  const form = new FormData()
  form.append(field, file)
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await requestWithRetry(getApiUrl(path), { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки')
  return data
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify({ ...body, platform: getPlatform() }) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify({ ...body, platform: getPlatform() }) }),
  verifyDevice: (body) => request('/auth/verify-device', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  checkId: (userId) => request(`/users/check-id/${encodeURIComponent(userId)}`),
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

  // Verification
  getVerifyStatus: () => request('/verify/status'),
  submitVerifyRequest: (message, verifyType) => request('/verify/request', { method: 'POST', body: JSON.stringify({ message, verifyType }) }),
  getVerifyRequests: () => request('/admin/verify-requests'),
  approveVerify: (requestId) => request('/admin/verify/approve', { method: 'POST', body: JSON.stringify({ requestId }) }),
  rejectVerify: (requestId) => request('/admin/verify/reject', { method: 'POST', body: JSON.stringify({ requestId }) }),

  // Stickers
  getStickerPacks: () => request('/stickers/all'),
  getMyStickerPacks: () => request('/stickers/my'),
  purchaseStickerPack: (packId) => request('/stickers/purchase', { method: 'POST', body: JSON.stringify({ packId }) }),
  uploadSticker: (file) => upload('/stickers/upload', 'file', file),
  createStickerPack: (title, stickers) => request('/stickers/create', { method: 'POST', body: JSON.stringify({ title, stickers }) }),
  request: (path, options) => request(path, options),
}

export function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.startsWith('https://')) return url
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//i, 'https://')
  }
  if (window.Capacitor?.isNativePlatform?.()) {
    return `https://ms-messenger-server.onrender.com${url}`
  }
  return url
}

export function getWsUrl() {
  const token = getToken()
  if (!token) return null
  return `wss://ms-messenger-server.onrender.com/ws?token=${token}`
}
