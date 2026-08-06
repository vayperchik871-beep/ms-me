import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { WebSocketServer } from 'ws'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dbGet, dbAll, dbRun, dbExec, SYSTEM_BOT, AI_ASSISTANT } from './db.js'
import multer from 'multer'
import { encrypt, decrypt, generateCode, hashDevice } from './crypto.js'
import { OAuth2Client } from 'google-auth-library'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = uploadsDir
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `${uuidv4()}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|ogg|oga|wav|mp3|webm|mov|heic|m4a|aac|flac|opus)$/i
    if (allowed.test(path.extname(file.originalname))) return cb(null, true)
    if (file.mimetype && (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/'))) return cb(null, true)
    cb(new Error('Недопустимый формат файла'))
  },
})

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const PUBLIC_URL = process.env.PUBLIC_URL || ''
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const googleAuth = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const frontendDistDir = path.join(rootDir, 'dist')
const indexHtmlPath = path.join(frontendDistDir, 'index.html')
const dataDir = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : null)
const uploadsDir = dataDir ? path.join(dataDir, 'uploads') : path.join(rootDir, 'uploads')

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.static(frontendDistDir))
app.use('/uploads', express.static(uploadsDir))

const clients = new Map()

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'ms-messenger-server' })
})

app.get('/debug', (req, res) => {
  res.json({
    rootDir,
    frontendDistDir,
    indexHtmlPath,
    distExists: fs.existsSync(frontendDistDir),
    indexExists: fs.existsSync(indexHtmlPath),
    cwd: process.cwd(),
    dirname: __dirname,
    dataDir,
    uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir),
    tursoEnabled: !!process.env.TURSO_DATABASE_URL,
  })
})

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    const session = await dbGet('SELECT * FROM sessions WHERE token = ?', header.slice(7))
    if (!session || session.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Сессия истекла' })
    }
    const row = await dbGet('SELECT id, user_id, name, is_system FROM users WHERE id = ?', payload.userId)
    if (!row) return res.status(401).json({ error: 'Пользователь не найден' })
    const adminRow = await dbGet('SELECT is_admin, banned FROM users WHERE id = ?', payload.userId)
    const user = { ...row, is_admin: adminRow?.is_admin || 0, banned: adminRow?.banned || 0 }
    if (user.banned) return res.status(403).json({ error: 'Аккаунт заблокирован' })
    req.user = user
    req.deviceId = payload.deviceId
    req.token = header.slice(7)
    next()
  } catch {
    return res.status(401).json({ error: 'Недействительный токен' })
  }
}

const SUBSCRIPTION_PLANS = {
  plus: { name: 'Plus', durationDays: 30, priceCents: 15000 },
  premium: { name: 'Premium', durationDays: 365, priceCents: 40000 },
}

function isSubActive(user) {
  return !!user.subscription_plan && user.subscription_until > Date.now()
}

async function requirePlus(req, res, next) {
  const row = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  if (!row || !isSubActive(row)) return res.status(403).json({ error: 'Требуется подписка Plus' })
  req.userPlus = row
  next()
}

function getLimits(user, subRow) {
  const hasPlus = subRow ? isSubActive(subRow) : false
  return {
    maxContacts: hasPlus ? 500 : 100,
    maxBioLength: hasPlus ? 300 : 100,
    maxFileSize: hasPlus ? 50 * 1024 * 1024 : 15 * 1024 * 1024,
    maxGroups: hasPlus ? 50 : 10,
  }
}

async function createToken(userId, deviceId) {
  const token = jwt.sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '30d' })
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  await dbRun('INSERT OR REPLACE INTO sessions (token, user_id, device_id, expires_at) VALUES (?, ?, ?, ?)',
    token, userId, deviceId, expiresAt
  )
  return token
}

async function getOrCreateDirectChat(userA, userB) {
  const rows = await dbAll(`
    SELECT c.id FROM chats c
    JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = ?
    JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = ?
    WHERE c.type = 'direct'
  `, userA, userB)
  if (rows.length > 0) return rows[0].id

  const chatId = uuidv4()
  const now = Date.now()
  await dbRun('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)', chatId, 'direct', now)
  await dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', chatId, userA)
  await dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', chatId, userB)
  return chatId
}

async function sendBotMessage(userId, text, chatId) {
  if (!chatId) chatId = await getOrCreateDirectChat(userId, SYSTEM_BOT.id)
  const msgId = uuidv4()
  const enc = encrypt(text)
  const now = Date.now()
  await dbRun(`
    INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, msgId, chatId, SYSTEM_BOT.id, enc.content_enc, enc.content_iv, enc.content_tag, now)

  broadcastToUser(userId, { type: 'new_message', chatId, message: await formatMessage(msgId, userId) })
  return { chatId, messageId: msgId }
}

async function sendAiMessage(chatId, botId, targetUserId, text) {
  const msgId = uuidv4()
  const enc = encrypt(text)
  const now = Date.now()
  await dbRun(`
    INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, msgId, chatId, botId, enc.content_enc, enc.content_iv, enc.content_tag, now)
  broadcastToUser(targetUserId, { type: 'new_message', chatId, message: await formatMessage(msgId, targetUserId) })
  return msgId
}

async function formatMessage(msgId, viewerId) {
  const m = await dbGet('SELECT * FROM messages WHERE id = ?', msgId)
  if (!m || m.deleted) return null
  const sender = await dbGet('SELECT id, user_id, name, is_system, avatar FROM users WHERE id = ?', m.sender_id)
  const reactions = await dbAll('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?', m.id)
  let attachment = null
  if (m.attachment) {
    try { attachment = JSON.parse(m.attachment) } catch {}
  }
  let read = false
  if (viewerId) {
    const participants = await dbAll('SELECT user_id, last_read FROM chat_participants WHERE chat_id = ? AND user_id != ?', m.chat_id, viewerId)
    read = participants.some((p) => p.last_read && p.last_read >= m.created_at)
  }
  let reply = null
  if (m.reply_to) {
    const rm = await dbGet('SELECT * FROM messages WHERE id = ? AND deleted = 0', m.reply_to)
    if (rm) {
      const rs = await dbGet('SELECT name FROM users WHERE id = ?', rm.sender_id)
      let ra = null
      if (rm.attachment) {
        try { const a = JSON.parse(rm.attachment); ra = { type: a.type, name: a.name } } catch {}
      }
      reply = {
        id: rm.id,
        senderName: rs?.name || '…',
        text: decrypt(rm.content_enc, rm.content_iv, rm.content_tag),
        attachment: ra,
      }
    }
  }
  return {
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    senderUserId: sender?.user_id,
    senderName: sender?.name,
    text: decrypt(m.content_enc, m.content_iv, m.content_tag),
    replyTo: m.reply_to,
    reply,
    pinned: !!m.pinned,
    edited: !!m.edited_at,
    time: formatTime(m.created_at),
    createdAt: m.created_at,
    reactions,
    attachment,
    read,
    channelPostId: m.channel_post_id || null,
  }
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function broadcastToUser(userId, data) {
  for (const [, ws] of clients) {
    if (ws.userId === userId && ws.readyState === 1) {
      ws.send(JSON.stringify(data))
    }
  }
}

function isUserOnline(userId) {
  return Array.from(clients.values()).some((c) => c.userId === userId)
}

async function broadcastToChat(chatId, data, excludeUserId) {
  const participants = await dbAll('SELECT user_id FROM chat_participants WHERE chat_id = ?', chatId)
  for (const p of participants) {
    if (p.user_id !== excludeUserId) broadcastToUser(p.user_id, data)
  }
}

function sanitizeUserId(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

const countryCache = new Map()

async function detectCountry(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) return null
  const cleanIp = ip.replace(/^::ffff:/, '')
  if (countryCache.has(cleanIp)) return countryCache.get(cleanIp)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const r = await fetch(`http://ip-api.com/json/${cleanIp}?fields=country,countryCode`, { signal: controller.signal })
    clearTimeout(timer)
    if (!r.ok) return null
    const d = await r.json()
    const result = d.status === 'success' && d.country ? { name: d.country, code: d.countryCode || null } : null
    countryCache.set(cleanIp, result)
    return result
  } catch (e) {
    return null
  }
}

// ─── Auth ───

app.post('/api/auth/register', async (req, res) => {
  const { name, userId, password, deviceId, phone, bio, avatar, platform } = req.body
  const isAdminApp = req.headers['x-admin-app'] === 'true'
  if (!name?.trim() || !userId?.trim() || !password || !deviceId || !phone) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' })
  }

  if (phone) {
    const cleanPhone = phone.trim()
    if (!/^\+777\d+$/.test(cleanPhone) || cleanPhone.length < 6) {
      return res.status(400).json({ error: 'Номер должен начинаться с +777 и содержать минимум 2 цифры после префикса' })
    }
    const phoneExist = await dbGet('SELECT id FROM users WHERE phone = ?', cleanPhone)
    if (phoneExist) return res.status(409).json({ error: 'Этот номер уже занят' })
  }

  const cleanId = sanitizeUserId(userId)
  if (cleanId.length < 3) {
    return res.status(400).json({ error: 'ID минимум 3 символа (латиница, цифры, _)' })
  }
  if (cleanId === 'ms-messenger') {
    return res.status(400).json({ error: 'Этот ID зарезервирован' })
  }

  const existing = await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)
  if (existing) return res.status(409).json({ error: 'Этот ID уже занят' })

  const countRow = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
  const isFirst = countRow.c === 0
  const id = uuidv4()
  const hash = await bcrypt.hash(password, 10)
  const now = Date.now()

  let avatarUrl = null
  if (avatar) {
    try {
      const buf = Buffer.from(avatar, 'base64')
      const avatarsDir = path.join(uploadsDir, 'avatars')
      if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true })
      const fileName = `${id}.png`
      fs.writeFileSync(path.join(avatarsDir, fileName), buf)
      avatarUrl = fullUrl(req, `/uploads/avatars/${fileName}`)
    } catch (e) { console.error('Avatar save error:', e) }
  }

  await dbRun('INSERT INTO users (id, user_id, name, password_hash, phone, bio, avatar, is_admin, profile_color, created_at, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, cleanId, name.trim(), hash, phone || null, bio || null, avatarUrl, isFirst ? 1 : 0, '#7c5cfc', now, platform || 'web'
  )

  const country = await detectCountry(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip)
  if (country) {
    await dbRun('UPDATE users SET country = ? WHERE id = ?', `${country.name}|${country.code || ''}`, id).catch(() => {})
  }

  const devId = hashDevice(deviceId)
  await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
    uuidv4(), id, devId, now, now
  )

  // Create chats in parallel (no extra SELECTs - fresh user, chats don't exist yet)
  const token = await createToken(id, devId)
  const sysChatId = uuidv4()
  const aiChatId = uuidv4()
  await Promise.all([
    dbRun('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)', sysChatId, 'direct', now),
    dbRun('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)', aiChatId, 'direct', now),
    dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', sysChatId, id),
    dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', sysChatId, SYSTEM_BOT.id),
    dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', aiChatId, id),
    dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', aiChatId, AI_ASSISTANT.id),
  ])
  await sendBotMessage(id, `Добро пожаловать в MS Messenger, ${name.trim()}!\n\nВаш ID: @${cleanId}\nНомер: ${phone || 'не указан'}\n\nДругие пользователи могут найти вас по ID или номеру.`, sysChatId)
  await sendBotMessage(id, `Политика конфиденциальности обновилась. Ознакомиться с ней можно в настройках приложения.`, sysChatId)
  await sendAiMessage(aiChatId, AI_ASSISTANT.id, id, `Привет! Я MSM Assistant — твой AI-помощник. Спрашивай что угодно о мессенджере, функциях или настройках.\n\nДоступные модели: Lite (всегда) и Pro (Premium). Выбрать можно в шапке чата.`)

  res.json({
    token,
    user: { id, userId: cleanId, name: name.trim(), phone: phone || null, bio: bio || null, avatar: avatarUrl, premium: false, aiModel: 'lite' },
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { userId, password, deviceId, platform } = req.body
  const isAdminApp = req.headers['x-admin-app'] === 'true'
  if (!userId || !password || !deviceId) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  const cleanId = sanitizeUserId(userId)
  let user = await dbGet('SELECT * FROM users WHERE user_id = ? AND is_system = 0', cleanId)
  if (!user) user = await dbGet('SELECT * FROM users WHERE phone = ? AND is_system = 0', cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  if (user.banned) return res.status(403).json({ error: 'Аккаунт заблокирован' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Неверный пароль' })

  const devId = hashDevice(deviceId)
  const device = await dbGet('SELECT * FROM devices WHERE user_id = ? AND device_id = ?', user.id, devId)

  if (!device) {
    await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
      uuidv4(), user.id, devId, Date.now(), Date.now()
    )
    if (platform) await dbRun('UPDATE users SET platform = ? WHERE id = ?', platform, user.id)
    const isPremium1 = user?.subscription_plan && user.subscription_until > Date.now()
    const token = await createToken(user.id, devId)
    return res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name, phone: user.phone, bio: user.bio, avatar: resolveMediaUrl(req, user.avatar), premium: isPremium1, aiModel: user.ai_model || 'lite' },
      needsVerification: false,
    })
  }

  if (device.verified || isAdminApp) {
    await dbRun('UPDATE devices SET last_seen = ? WHERE id = ?', Date.now(), device.id)
    if (platform) await dbRun('UPDATE users SET platform = ? WHERE id = ?', platform, user.id)
    const isPremium2 = user?.subscription_plan && user.subscription_until > Date.now()
    const token = await createToken(user.id, devId)
    return res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name, phone: user.phone, bio: user.bio, avatar: resolveMediaUrl(req, user.avatar), premium: isPremium2, aiModel: user.ai_model || 'lite' },
      needsVerification: false,
    })
  }

  const code = generateCode()
  const codeId = uuidv4()
  const expires = Date.now() + 10 * 60 * 1000

  await dbRun(`
    INSERT INTO verification_codes (id, user_id, code, device_id, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, codeId, user.id, code, devId, expires)

  if (!device) {
    await dbRun('INSERT INTO devices (id, user_id, device_id, verified, created_at) VALUES (?, ?, ?, 0, ?)',
      uuidv4(), user.id, devId, Date.now()
    )
  }

  await sendBotMessage(user.id, `🔐 Код подтверждения для нового устройства:\n\n${code}\n\nКод действителен 10 минут. Никому не сообщайте его.`)

  res.json({
    needsVerification: true,
    userId: user.user_id,
    message: 'Код отправлен в чат MS-Мессенджер',
  })
})

app.post('/api/auth/verify-device', async (req, res) => {
  const { userId, code, deviceId } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = await dbGet('SELECT * FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

  const devId = hashDevice(deviceId)
  const record = await dbGet(`
    SELECT * FROM verification_codes
    WHERE user_id = ? AND code = ? AND device_id = ? AND used = 0 AND expires_at > ?
    ORDER BY expires_at DESC LIMIT 1
  `, user.id, code, devId, Date.now())

  if (!record) return res.status(400).json({ error: 'Неверный или просроченный код' })

  await dbRun('UPDATE verification_codes SET used = 1 WHERE id = ?', record.id)
  await dbRun('UPDATE devices SET verified = 1, last_seen = ? WHERE user_id = ? AND device_id = ?',
    Date.now(), user.id, devId
  )

  const token = await createToken(user.id, devId)
  res.json({
    token,
    user: { id: user.id, userId: user.user_id, name: user.name, phone: user.phone, bio: user.bio, avatar: resolveMediaUrl(req, user.avatar) },
  })
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const u = await dbGet('SELECT id, user_id, name, phone, bio, is_system, avatar, birthday, gender, profile_color, mcoins, subscription_plan, subscription_until, ai_model, music FROM users WHERE id = ?', req.user.id)
  const extra = await dbGet('SELECT is_admin, banned FROM users WHERE id = ?', req.user.id)
  res.json({ user: {
    ...serializeUser(u, { req, extra }),
    subscriptionPlan: u?.subscription_plan || null,
    subscriptionUntil: u?.subscription_until || null,
  } })
})

// ─── Google Auth ───

const GOOGLE_REDIRECT_URI = 'https://ms-messenger-server.onrender.com/api/auth/google/callback'

app.get('/api/auth/google/redirect', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google не настроен' })
  const state = Math.random().toString(36).slice(2)
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=' + encodeURIComponent(GOOGLE_CLIENT_ID) +
    '&redirect_uri=' + encodeURIComponent(GOOGLE_REDIRECT_URI) +
    '&response_type=id_token' +
    '&scope=openid%20profile%20email' +
    '&state=' + state +
    '&nonce=' + Math.random().toString(36).slice(2)
  res.redirect(url)
})

app.get('/api/auth/google/callback', async (req, res) => {
  const { id_token } = req.query
  const frontendUrl = 'https://ms-messenger-web.vercel.app'
  if (!id_token) {
    return res.redirect(frontendUrl + '#google_error=no_token')
  }
  if (!googleAuth) {
    return res.redirect(frontendUrl + '#google_error=no_config')
  }
  try {
    let payload
    try {
      const ticket = await googleAuth.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID })
      payload = ticket.getPayload()
    } catch {
      const info = await googleAuth.getTokenInfo(id_token)
      if (!info) throw new Error('Invalid token')
      payload = { sub: info.sub, email: info.email }
    }
    if (!payload?.sub) return res.redirect(frontendUrl + '#google_error=invalid')
    const googleId = payload.sub
    const email = payload.email
    const googleName = payload.name || (email ? email.split('@')[0] : 'User')
    const avatarUrl = payload.picture || null
    let user = await dbGet('SELECT * FROM users WHERE google_id = ?', googleId)
    if (!user) {
      const countRow = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
      const isFirst = countRow.c === 0
      let baseId = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) : ''
      if (!baseId || baseId.length < 3) baseId = 'user' + Math.random().toString(36).slice(2, 6)
      let cleanId = baseId
      let suffix = 1
      while (await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)) {
        cleanId = baseId.slice(0, 18 - String(suffix).length) + suffix
        suffix++
      }
      const tempId = 'google_' + Math.random().toString(36).slice(2, 8)
      const id = uuidv4()
      const fakeHash = await bcrypt.hash(uuidv4(), 12)
      const now = Date.now()
      await dbRun(
        'INSERT INTO users (id, user_id, name, password_hash, google_id, avatar, is_admin, profile_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id, tempId, googleName, fakeHash, googleId, avatarUrl, isFirst ? 1 : 0, '#7c5cfc', now
      )
      const devId = hashDevice('google_auth_' + googleId)
      await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        uuidv4(), id, devId, now, now
      )
      const token = await createToken(id, devId)
      await getOrCreateDirectChat(id, SYSTEM_BOT.id)
      await sendBotMessage(id, `Добро пожаловать в MS Messenger, ${googleName}!\n\nВы вошли через Google. Ваш временный ID: @${tempId}\n\nПожалуйста, создайте полноценный аккаунт через «Настройки» → «Аккаунт».`)
      return res.redirect(frontendUrl + '#google_token=' + encodeURIComponent(token) + '&google_user=' + encodeURIComponent(JSON.stringify({ id, userId: tempId, name: googleName, avatar: avatarUrl, needsSetup: true })))
    }
    const devId = hashDevice('google_auth_' + googleId)
    const device = await dbGet('SELECT * FROM devices WHERE user_id = ? AND device_id = ?', user.id, devId)
    if (!device) {
      await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        uuidv4(), user.id, devId, Date.now(), Date.now()
      )
    } else {
      await dbRun('UPDATE devices SET last_seen = ? WHERE id = ?', Date.now(), device.id)
    }
    if (avatarUrl && avatarUrl !== user.avatar) {
      await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, user.id)
    }
    const token = await createToken(user.id, devId)
    return res.redirect(frontendUrl + '#google_token=' + encodeURIComponent(token) + '&google_user=' + encodeURIComponent(JSON.stringify({ id: user.id, userId: user.user_id, name: user.name, avatar: avatarUrl })))
  } catch (err) {
    console.error('Google callback error:', err)
    return res.redirect(frontendUrl + '#google_error=server_error')
  }
})

app.post('/api/auth/google', async (req, res) => {
  const { idToken, deviceId } = req.body
  if (!idToken || !deviceId) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }
  if (!googleAuth) {
    return res.status(500).json({ error: 'Google Auth не настроен (GOOGLE_CLIENT_ID)' })
  }

  try {
    let payload

    // Try as ID token first, then as access token
    try {
      const ticket = await googleAuth.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })
      payload = ticket.getPayload()
    } catch {
      // Fallback: verify as access token
      const info = await googleAuth.getTokenInfo(idToken)
      if (!info) throw new Error('Invalid token')
      payload = { sub: info.sub, email: info.email }
    }

    if (!payload?.sub) {
      return res.status(400).json({ error: 'Недействительный Google токен' })
    }

    const googleId = payload.sub
    const email = payload.email
    const googleName = payload.name || (email ? email.split('@')[0] : 'User')
    const avatarUrl = payload.picture || null

    let user = await dbGet('SELECT * FROM users WHERE google_id = ?', googleId)
    const isAdminApp = req.headers['x-admin-app'] === 'true'

    if (!user) {
      const countRow = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
      const isFirst = countRow.c === 0

      let baseId = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) : ''
      if (!baseId || baseId.length < 3) baseId = 'user' + Math.random().toString(36).slice(2, 6)
      let cleanId = baseId
      let suffix = 1
      while (await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)) {
        cleanId = baseId.slice(0, 18 - String(suffix).length) + suffix
        suffix++
      }

      const tempId = 'google_' + Math.random().toString(36).slice(2, 8)
      const id = uuidv4()
      const fakeHash = await bcrypt.hash(uuidv4(), 12)
      const now = Date.now()

      await dbRun(
        'INSERT INTO users (id, user_id, name, password_hash, google_id, avatar, is_admin, profile_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id, tempId, googleName, fakeHash, googleId, avatarUrl, isFirst ? 1 : 0, '#7c5cfc', now
      )
      await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        uuidv4(), id, hashDevice(deviceId), now, now
      )
      const token = await createToken(id, hashDevice(deviceId))
      await getOrCreateDirectChat(id, SYSTEM_BOT.id)

      return res.json({ needsSetup: true, token, user: { id, userId: tempId, name: googleName, avatar: avatarUrl } })
    }

    // Existing Google user — log in
    const devId = hashDevice(deviceId)
    const device = await dbGet('SELECT * FROM devices WHERE user_id = ? AND device_id = ?', user.id, devId)
    if (!device) {
      await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        uuidv4(), user.id, devId, Date.now(), Date.now()
      )
    } else {
      await dbRun('UPDATE devices SET last_seen = ? WHERE id = ?', Date.now(), device.id)
    }
    if (avatarUrl && avatarUrl !== user.avatar) {
      await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, user.id)
    }

    const token = await createToken(user.id, devId)
    res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name, phone: user.phone, bio: user.bio, avatar: user.avatar },
    })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Ошибка верификации Google' })
  }
})

// ─── Public Dashboard (без авторизации) ───

app.get('/api/dashboard', async (req, res) => {
  const DAY = 86400000
  const now = Date.now()

  const totalUsers = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
  const onlineUsers = Array.from(clients.values()).filter((c) => c.readyState === 1).length
  const totalMessages = await dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0')
  const totalChats = await dbGet('SELECT COUNT(*) as c FROM chats')

  const byPeriod = async (days) => {
    const r = await dbGet(
      'SELECT COUNT(*) as c FROM users WHERE is_system = 0 AND created_at >= ?',
      now - days * DAY
    )
    return r.c
  }

  const [today, week, month] = await Promise.all([byPeriod(1), byPeriod(7), byPeriod(30)])

  const registrations = await dbAll(`
    SELECT created_at FROM users WHERE is_system = 0 AND created_at >= ?
  `, now - 30 * DAY)

  const perDay = []
  const nowDate = new Date()
  nowDate.setHours(0, 0, 0, 0)
  const todayStart = nowDate.getTime()
  for (let i = 29; i >= 0; i--) {
    const dayStart = todayStart - i * DAY
    const d = new Date(dayStart)
    perDay.push({
      date: `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      count: registrations.filter((r) => r.created_at >= dayStart && r.created_at < dayStart + DAY).length,
    })
  }

  const usersByPlatform = await dbAll("SELECT platform, COUNT(*) as c FROM users WHERE is_system = 0 GROUP BY platform")
  const platformStats = {}
  for (const row of usersByPlatform) platformStats[row.platform || 'web'] = row.c

  const onlineIds = Array.from(clients.values()).filter((c) => c.readyState === 1).map((c) => c.userId)
  const onlineByPlatform = {}
  if (onlineIds.length) {
    const onlineRows = await dbAll(`SELECT platform, COUNT(*) as c FROM users WHERE id IN (${onlineIds.map(() => '?').join(',')}) GROUP BY platform`, onlineIds)
    for (const row of onlineRows) onlineByPlatform[row.platform || 'web'] = row.c
  }

  const [messagesToday, messagesWeek, avgMsg, groupsCount] = await Promise.all([
    dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0 AND created_at >= ?', now - DAY),
    dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0 AND created_at >= ?', now - 7 * DAY),
    dbGet('SELECT ROUND(COUNT(*) * 1.0 / MAX(1, (SELECT COUNT(*) FROM users WHERE is_system = 0))) as c FROM messages WHERE deleted = 0'),
    dbGet("SELECT COUNT(*) as c FROM chats WHERE type IN ('group', 'channel')"),
  ])

  const dayMsgs = await dbAll('SELECT created_at FROM messages WHERE deleted = 0 AND created_at >= ?', now - DAY)
  const hourBuckets = []
  const hourStart = new Date(now - DAY)
  hourStart.setMinutes(0, 0, 0)
  const base = hourStart.getTime()
  const hourCounts = new Array(25).fill(0)
  for (const m of dayMsgs) {
    const idx = Math.min(24, Math.floor((m.created_at - base) / 3600000))
    hourCounts[idx]++
  }
  for (let i = 0; i <= 24; i++) {
    const d = new Date(base + i * 3600000)
    hourBuckets.push({ hour: `${d.getHours().toString().padStart(2, '0')}`, count: hourCounts[i] })
  }

  const topChats = await dbAll(`
    SELECT c.id, c.name, c.type, COUNT(m.id) as cnt
    FROM messages m JOIN chats c ON c.id = m.chat_id
    WHERE m.deleted = 0
    GROUP BY m.chat_id
    ORDER BY cnt DESC LIMIT 5
  `)

  const byCountry = await dbAll("SELECT country, COUNT(*) as c FROM users WHERE is_system = 0 AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 12")
  const countryStats = byCountry.map((row) => {
    const [name, code] = String(row.country).split('|')
    return { name, code: code || null, count: row.c }
  })

  res.json({
    totalUsers: totalUsers.c,
    onlineUsers,
    totalMessages: totalMessages.c,
    totalChats: totalChats.c,
    newToday: today,
    newWeek: week,
    newMonth: month,
    registrationsPerDay: perDay,
    platformStats,
    onlineByPlatform,
    countryStats,
    messagesToday: messagesToday.c,
    messagesWeek: messagesWeek.c,
    avgMsgPerUser: Math.round(avgMsg.c),
    groupsCount: groupsCount.c,
    activityByHour: hourBuckets,
    topChats,
    serverTime: now,
    uptime: process.uptime(),
  })
})

// ─── Admin ───

app.post('/api/admin/promote', authMiddleware, async (req, res) => {
  const { secret } = req.body
  const adminSecret = process.env.ADMIN_SECRET || 'admin123'
  if (!secret || secret !== adminSecret) {
    return res.status(403).json({ error: 'Неверный секрет' })
  }
  await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', req.user.id)
  res.json({ ok: true })
})

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Только для администраторов' })
  }
  next()
}

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const totalUsers = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
  const onlineUsers = Array.from(clients.values()).filter((c) => c.readyState === 1).length
  const bannedUsers = await dbGet('SELECT COUNT(*) as c FROM users WHERE banned = 1')
  const scamUsers = await dbGet('SELECT COUNT(*) as c FROM users WHERE scam = 1')
  const totalChats = await dbGet('SELECT COUNT(*) as c FROM chats')
  const totalMessages = await dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const messagesToday = await dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0 AND created_at >= ?', [todayMs])
  const groupsCount = await dbGet("SELECT COUNT(*) as c FROM chats WHERE type IN ('group', 'channel')")
  const botsCount = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 1')
  const registrationsToday = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0 AND created_at >= ?', [todayMs])
  const usersByPlatform = await dbAll("SELECT platform, COUNT(*) as c FROM users WHERE is_system = 0 GROUP BY platform")
  const platformStats = {}
  for (const row of usersByPlatform) { platformStats[row.platform || 'web'] = row.c }
  res.json({
    totalUsers: totalUsers.c,
    onlineUsers,
    bannedUsers: bannedUsers.c,
    scamUsers: scamUsers.c,
    totalChats: totalChats.c,
    totalMessages: totalMessages.c,
    messagesToday: messagesToday.c,
    groupsCount: groupsCount.c,
    botsCount: botsCount.c,
    registrationsToday: registrationsToday.c,
    platformStats,
  })
})

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await dbAll(`
    SELECT id, user_id, name, is_admin, banned, scam, platform, subscription_plan, subscription_until, created_at FROM users WHERE is_system = 0 ORDER BY created_at DESC LIMIT 100
  `)
  res.json({ users: users.map((u) => ({
    id: u.id,
    userId: u.user_id,
    name: u.name,
    isAdmin: !!u.is_admin,
    banned: !!u.banned,
    scam: !!u.scam,
    platform: u.platform || 'web',
    premium: u.subscription_plan && u.subscription_until > Date.now() ? (u.subscription_plan === 'premium' ? 'pro' : u.subscription_plan) : null,
    online: isUserOnline(u.id),
    createdAt: u.created_at,
  })) })
})

app.post('/api/admin/ban', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId, value } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  await dbRun('UPDATE users SET banned = ? WHERE id = ?', value ? 1 : 0, user.id)
  res.json({ ok: true, userId: cleanId, banned: !!value })
})

app.post('/api/admin/scam', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId, value } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = await dbGet('SELECT id, name FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  const oldName = user.name
  const newName = value ? `[SCAM] ${oldName.replace(/^\[SCAM\]\s*/i, '')}` : oldName.replace(/^\[SCAM\]\s*/i, '')
  await dbRun('UPDATE users SET scam = ?, name = ? WHERE id = ?', value ? 1 : 0, newName, user.id)
  res.json({ ok: true, userId: cleanId, scam: !!value, name: newName })
})

app.post('/api/admin/command', authMiddleware, adminMiddleware, async (req, res) => {
  const { command } = req.body
  if (!command || typeof command !== 'string') return res.status(400).json({ error: 'Команда не указана' })
  const parts = command.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)
  const say = (msg) => ({ output: msg })
  try {
    switch (cmd) {
      case 'help': {
        return res.json(say([
          'Доступные команды:',
          '  stats          — статистика сервера',
          '  users          — список всех пользователей (100)',
          '  ban <id>       — забанить пользователя',
          '  unban <id>     — разбанить пользователя',
          '  scam <id>      — пометить как скам',
          '  unscam <id>    — снять метку скам',
          '  promote <id>   — сделать пользователя админом',
          '  demote <id>    — снять админ-права',
          '  delete <id>    — удалить пользователя и все его данные',
          '  online         — список онлайн пользователей',
          '  bc <text>      — отправить сообщение всем чатам (broadcast)',
          '  say <id> <msg> — написать от имени бота в личный чат с пользователем',
          '  verifys        — список заявок на верификацию',
          '  verify <id>    — одобрить заявку',
          '  reject <id>    — отклонить заявку',
          '  music          — треки на модерации',
          '  approving <id> — одобрить трек',
          '  rejecttrack <id> — отклонить трек',
          '  sub <id> <plan> [days] — выдать подписку (plus/premium)',
          '  unsub <id>     — отменить подписку',
          '  subcodes <n> <plan> <days> — сгенерировать N кодов активации',
          '  substats       — статистика подписок',
          '  addsticker <title> <stickerUrls...> — создать стикерпак',
          '  delsticker <id> — удалить стикерпак',
          '  tickets        — открытые тикеты поддержки',
          '  reply <id> <text> — ответить в тикет',
          '  clear          — очистить терминал',
          '  purge          — удалить ВСЕ аккаунты (кроме системного)',
          '  help           — эта справка',
        ].join('\n')))
      }
      case 'stats': {
        const totalUsers = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
        const online = Array.from(clients.values()).filter((c) => c.readyState === 1).length
        const banned = await dbGet('SELECT COUNT(*) as c FROM users WHERE banned = 1')
        const scam = await dbGet('SELECT COUNT(*) as c FROM users WHERE scam = 1')
        const chats = await dbGet('SELECT COUNT(*) as c FROM chats')
        const msgs = await dbGet('SELECT COUNT(*) as c FROM messages WHERE deleted = 0')
        return res.json(say([
          `Аккаунтов: ${totalUsers.c}`,
          `Онлайн: ${online}`,
          `Забанено: ${banned.c}`,
          `Скам: ${scam.c}`,
          `Чатов: ${chats.c}`,
          `Сообщений: ${msgs.c}`,
        ].join('\n')))
      }
      case 'users': {
        const users = await dbAll('SELECT user_id, name, is_admin, banned, scam FROM users WHERE is_system = 0 ORDER BY created_at DESC LIMIT 100')
        const lines = users.map((u) =>
          `@${u.user_id} "${u.name}"${u.is_admin ? ' [ADMIN]' : ''}${u.banned ? ' [BANNED]' : ''}${u.scam ? ' [SCAM]' : ''}`
        )
        return res.json(say(lines.length ? lines.join('\n') : 'Нет пользователей'))
      }
      case 'ban': {
        if (!args[0]) return res.json(say('Укажите userId: ban <id>'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ?', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        await dbRun('UPDATE users SET banned = 1 WHERE id = ?', user.id)
        return res.json(say(`@${args[0]} забанен`))
      }
      case 'unban': {
        if (!args[0]) return res.json(say('Укажите userId: unban <id>'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ?', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        await dbRun('UPDATE users SET banned = 0 WHERE id = ?', user.id)
        return res.json(say(`@${args[0]} разбанен`))
      }
      case 'scam': {
        if (!args[0]) return res.json(say('Укажите userId: scam <id>'))
        const user = await dbGet('SELECT id, name FROM users WHERE user_id = ?', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const newName = `[SCAM] ${user.name.replace(/^\[SCAM\]\s*/i, '')}`
        await dbRun('UPDATE users SET scam = 1, name = ? WHERE id = ?', newName, user.id)
        return res.json(say(`@${args[0]} помечен как скам (имя: ${newName})`))
      }
      case 'unscam': {
        if (!args[0]) return res.json(say('Укажите userId: unscam <id>'))
        const user = await dbGet('SELECT id, name FROM users WHERE user_id = ?', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const newName = user.name.replace(/^\[SCAM\]\s*/i, '')
        await dbRun('UPDATE users SET scam = 0, name = ? WHERE id = ?', newName, user.id)
        return res.json(say(`Метка скам снята с @${args[0]} (имя: ${newName})`))
      }
      case 'promote': {
        if (!args[0]) return res.json(say('Укажите userId: promote <id>'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ? AND is_system = 0', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', user.id)
        return res.json(say(`@${args[0]} теперь админ`))
      }
      case 'demote': {
        if (!args[0]) return res.json(say('Укажите userId: demote <id>'))
        if (args[0] === 'admin') return res.json(say('Нельзя снять админа с главного аккаунта'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ? AND is_system = 0', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        await dbRun('UPDATE users SET is_admin = 0 WHERE id = ?', user.id)
        return res.json(say(`У @${args[0]} сняты админ-права`))
      }
      case 'delete': {
        if (!args[0]) return res.json(say('Укажите userId: delete <id>'))
        if (args[0] === 'admin') return res.json(say('Нельзя удалить главный аккаунт'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ? AND is_system = 0', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const id = user.id
        await dbExec('PRAGMA foreign_keys = OFF')
        try {
          await dbRun(`DELETE FROM message_reactions WHERE user_id = '${id}' OR message_id IN (SELECT id FROM messages WHERE sender_id = '${id}')`)
          await dbRun(`DELETE FROM favorites WHERE user_id = '${id}' OR message_id IN (SELECT id FROM messages WHERE sender_id = '${id}')`)
          await dbRun(`DELETE FROM user_gifts WHERE user_id = '${id}' OR sender_id = '${id}'`)
          await dbRun(`DELETE FROM messages WHERE sender_id = '${id}'`)
          await dbRun(`DELETE FROM chat_participants WHERE user_id = '${id}'`)
          await dbRun(`DELETE FROM contacts WHERE user_id = '${id}' OR contact_id = '${id}'`)
          await dbRun(`DELETE FROM verification_codes WHERE user_id = '${id}'`)
          await dbRun(`DELETE FROM verification_requests WHERE user_id = '${id}'`)
          await dbRun(`DELETE FROM sessions WHERE user_id = '${id}'`)
          await dbRun(`DELETE FROM devices WHERE user_id = '${id}'`)
          await dbRun(`DELETE FROM chats WHERE id NOT IN (SELECT DISTINCT chat_id FROM chat_participants)`)
          await dbRun(`DELETE FROM users WHERE id = '${id}'`)
        } finally {
          await dbExec('PRAGMA foreign_keys = ON')
        }
        return res.json(say(`@${args[0]} удалён`))
      }
      case 'online': {
        const online = Array.from(clients.values()).filter((c) => c.readyState === 1)
        return res.json(say(`Онлайн (${online.length}):`))
      }
      case 'bc':
      case 'broadcast': {
        const text = args.join(' ')
        if (!text) return res.json(say('Напишите текст: bc <сообщение>'))
        const botRow = await dbGet('SELECT id FROM users WHERE is_system = 1 LIMIT 1')
        const botId = SYSTEM_BOT?.id || botRow?.id
        if (!botId) return res.json(say('Системный бот не найден'))
        const chatsList = await dbAll('SELECT id FROM chats')
        for (const chat of chatsList) {
          await dbRun('INSERT INTO messages (chat_id, sender_id, content_enc, content_iv, content_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            chat.id, botId, encrypt(text).content_enc, encrypt(text).content_iv, encrypt(text).content_tag, Date.now()
          )
        }
        return res.json(say(`Сообщение отправлено в ${chatsList.length} чатов`))
      }
      case 'say': {
        const targetId = args[0]
        const text = args.slice(1).join(' ')
        if (!targetId || !text) return res.json(say('Укажите: say <userId> <сообщение>'))
        const target = await dbGet('SELECT id FROM users WHERE user_id = ?', targetId)
        if (!target) return res.json(say('Пользователь не найден'))
        const botRow = await dbGet('SELECT id FROM users WHERE is_system = 1 LIMIT 1')
        const botId = SYSTEM_BOT?.id || botRow?.id
        if (!botId) return res.json(say('Системный бот не найден'))
        let chat = await dbGet(`
          SELECT c.id FROM chats c
          INNER JOIN chat_participants cm ON cm.chat_id = c.id
          WHERE c.type = 'direct' AND cm.user_id = ? AND c.id IN (SELECT chat_id FROM chat_participants WHERE user_id = ?)
        `, target.id, botId)
        if (!chat) {
          const chatId = uuidv4()
          await dbRun('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)', chatId, 'direct', Date.now())
          await dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', chatId, target.id)
          await dbRun('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)', chatId, botId)
          chat = { id: chatId }
        }
        const enc = encrypt(text)
        await dbRun('INSERT INTO messages (chat_id, sender_id, content_enc, content_iv, content_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          chat.id, botId, enc.content_enc, enc.content_iv, enc.content_tag, Date.now()
        )
        return res.json(say(`Сообщение отправлено @${targetId}`))
      }
      case 'purge': {
        if (args[0] !== '--force') {
          return res.json(say('ВНИМАНИЕ: это удалит ВСЕ аккаунты и данные. Подтверди: purge --force'))
        }
        const count = await dbGet('SELECT COUNT(*) as c FROM users WHERE is_system = 0')
        const userIds = await dbAll('SELECT id FROM users WHERE is_system = 0')
        const ids = userIds.map(r => `'${r.id}'`).join(',')
        if (!ids) return res.json(say('Нет аккаунтов для удаления'))
        await dbExec('PRAGMA foreign_keys = OFF')
        try {
          await dbRun(`DELETE FROM message_reactions WHERE user_id IN (${ids}) OR message_id IN (SELECT id FROM messages WHERE sender_id IN (${ids}))`)
          await dbRun(`DELETE FROM favorites WHERE user_id IN (${ids}) OR message_id IN (SELECT id FROM messages WHERE sender_id IN (${ids}))`)
          await dbRun(`DELETE FROM user_gifts WHERE user_id IN (${ids}) OR sender_id IN (${ids})`)
          await dbRun(`DELETE FROM messages WHERE sender_id IN (${ids})`)
          await dbRun(`DELETE FROM chat_participants WHERE user_id IN (${ids})`)
          await dbRun(`DELETE FROM contacts WHERE user_id IN (${ids}) OR contact_id IN (${ids})`)
          await dbRun(`DELETE FROM verification_codes WHERE user_id IN (${ids})`)
          await dbRun(`DELETE FROM verification_requests WHERE user_id IN (${ids})`)
          await dbRun(`DELETE FROM sessions WHERE user_id IN (${ids})`)
          await dbRun(`DELETE FROM devices WHERE user_id IN (${ids})`)
          await dbRun(`DELETE FROM chats WHERE id NOT IN (SELECT DISTINCT chat_id FROM chat_participants)`)
          await dbRun(`DELETE FROM users WHERE is_system = 0`)
        } finally {
          await dbExec('PRAGMA foreign_keys = ON')
        }
        return res.json(say(`Очищено аккаунтов: ${count.c}. Все данные удалены.`))
      }
      case 'verifys': {
        const requests = await dbAll(`
          SELECT vr.*, u.username, u.email, u.phone, u.name
          FROM verification_requests vr
          JOIN users u ON u.id = vr.user_id
          ORDER BY vr.created_at DESC
        `)
        if (requests.length === 0) return res.json(say('Нет заявок на верификацию'))
        const lines = requests.map((r) =>
          `#${r.id} | @${r.username} (${r.name || '—'}) | тип: ${r.verify_type || 'user'} | статус: ${r.status}`
        )
        return res.json(say(lines.join('\n')))
      }
      case 'verify': {
        const id = args[0]
        if (!id) return res.json(say('Укажите ID заявки: verify <id>'))
        const row = await dbGet('SELECT user_id, verify_type FROM verification_requests WHERE id = ?', [id])
        if (!row) return res.json(say('Заявка не найдена'))
        await dbRun("UPDATE users SET is_verified = 1, verify_type = ? WHERE id = ?", row.verify_type || 'msm', row.user_id)
        await dbRun('UPDATE verification_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?', 'approved', Date.now(), req.user.id, id)
        return res.json(say(`Заявка #${id} одобрена`))
      }
      case 'reject': {
        const id = args[0]
        if (!id) return res.json(say('Укажите ID заявки: reject <id>'))
        const row = await dbGet('SELECT user_id FROM verification_requests WHERE id = ?', [id])
        if (!row) return res.json(say('Заявка не найдена'))
        await dbRun('UPDATE verification_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?', 'rejected', Date.now(), req.user.id, id)
        return res.json(say(`Заявка #${id} отклонена`))
      }
      case 'music': {
        const rows = await dbAll(`SELECT mt.*, u.user_id as submitter FROM music_tracks mt LEFT JOIN users u ON u.id = mt.user_id WHERE mt.status = 'moderation' ORDER BY mt.created_at DESC`)
        if (rows.length === 0) return res.json(say('Нет треков на модерации'))
        const lines = rows.map((t) => `${t.id} | "${t.title}" — ${t.artist_name} | от @${t.submitter || '?'} | ${t.format} | ${new Date(t.created_at).toLocaleString('ru-RU')}`)
        return res.json(say(lines.join('\n')))
      }
      case 'approving': {
        const id = args[0]
        if (!id) return res.json(say('Укажите ID трека: approving <id>'))
        const t = await dbGet('SELECT * FROM music_tracks WHERE id = ?', [id])
        if (!t) return res.json(say('Трек не найден'))
        await dbRun("UPDATE music_tracks SET status = 'published', reviewed_at = ?, reviewed_by = ? WHERE id = ?", Date.now(), req.user.id, id)
        return res.json(say(`Трек "${t.title}" опубликован`))
      }
      case 'rejecttrack': {
        const id = args[0]
        if (!id) return res.json(say('Укажите ID трека: rejecttrack <id>'))
        const t = await dbGet('SELECT * FROM music_tracks WHERE id = ?', [id])
        if (!t) return res.json(say('Трек не найден'))
        await dbRun("UPDATE music_tracks SET status = 'rejected', reviewed_at = ?, reviewed_by = ? WHERE id = ?", Date.now(), req.user.id, id)
        return res.json(say(`Трек "${t.title}" отклонён`))
      }
      case 'sub': {
        if (!args[0] || !args[1]) return res.json(say('Укажите: sub <userId> <plan> [days]'))
        const plan = args[1].toLowerCase()
        if (!SUBSCRIPTION_PLANS[plan]) return res.json(say('План должен быть plus или premium'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ? AND is_system = 0', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const days = args[2] ? parseInt(args[2]) : SUBSCRIPTION_PLANS[plan].durationDays
        if (!days || days < 1) return res.json(say('Некорректное количество дней'))
        const now = Date.now()
        const existing = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', user.id)
        const currentUntil = (existing.subscription_until && existing.subscription_until > now) ? existing.subscription_until : now
        const newUntil = currentUntil + days * 86400000
        await dbRun('UPDATE users SET subscription_plan = ?, subscription_until = ? WHERE id = ?', plan, newUntil, user.id)
        return res.json(say(`@${args[0]} получил ${plan} до ${new Date(newUntil).toLocaleDateString('ru-RU')}`))
      }
      case 'unsub': {
        if (!args[0]) return res.json(say('Укажите userId: unsub <id>'))
        const user = await dbGet('SELECT id FROM users WHERE user_id = ? AND is_system = 0', args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        await dbRun("UPDATE users SET subscription_plan = NULL, subscription_until = NULL, ai_model = 'lite' WHERE id = ?", user.id)
        return res.json(say(`Подписка @${args[0]} отменена, модель сброшена на Lite`))
      }
      case 'subcodes': {
        const n = parseInt(args[0])
        const plan = args[1]?.toLowerCase()
        const days = parseInt(args[2])
        if (!n || n < 1 || n > 100) return res.json(say('Укажите количество кодов (1-100)'))
        if (!plan || !SUBSCRIPTION_PLANS[plan]) return res.json(say('Укажите план: plus или premium'))
        if (!days || days < 1) return res.json(say('Укажите количество дней'))
        const now = Date.now()
        const codes = []
        for (let i = 0; i < n; i++) {
          const code = 'SUB-' + Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
          await dbRun('INSERT INTO subscription_codes (code, plan, duration_days, created_by, created_at) VALUES (?, ?, ?, ?, ?)', code, plan, days, req.user.id, now)
          codes.push(code)
        }
        return res.json(say(`Сгенерировано ${codes.length} кодов ${plan} (${days} дн.):\n${codes.join('\n')}`))
      }
      case 'substats': {
        const total = await dbGet("SELECT COUNT(*) as c FROM users WHERE subscription_plan IS NOT NULL AND subscription_until > ?", Date.now())
        const byPlan = await dbAll("SELECT subscription_plan, COUNT(*) as c FROM users WHERE subscription_plan IS NOT NULL AND subscription_until > ? GROUP BY subscription_plan", Date.now())
        const usedCodes = await dbGet('SELECT COUNT(*) as c FROM subscription_codes WHERE used_by IS NOT NULL')
        const totalCodes = await dbGet('SELECT COUNT(*) as c FROM subscription_codes')
        const lines = [`Активных подписок: ${total.c}`]
        for (const p of byPlan) lines.push(`  ${p.subscription_plan}: ${p.c}`)
        lines.push(`Кодов активации: ${usedCodes.c}/${totalCodes.c} использовано`)
        return res.json(say(lines.join('\n')))
      }
      case 'addsticker': {
        const title = args[0]
        const stickerUrls = args.slice(1)
        if (!title) return res.json(say('Укажите название пакета'))
        if (stickerUrls.length === 0) return res.json(say('Укажите URL стикеров'))
        const id = uuidv4()
        await dbRun('INSERT INTO sticker_packs (id, title, author, stickers, price, created_at) VALUES (?, ?, ?, ?, ?, ?)', id, title, req.user.id, JSON.stringify(stickerUrls), 0, Date.now())
        return res.json(say(`Стикерпак "${title}" создан (id: ${id})`))
      }
      case 'delsticker': {
        if (!args[0]) return res.json(say('Укажите ID стикерпака'))
        await dbRun('DELETE FROM user_sticker_packs WHERE pack_id = ?', args[0])
        await dbRun('DELETE FROM sticker_packs WHERE id = ?', args[0])
        return res.json(say('Стикерпак удалён'))
      }
      case 'tickets': {
        const tickets = await dbAll("SELECT * FROM support_tickets WHERE status = 'open' ORDER BY created_at ASC")
        if (tickets.length === 0) return res.json(say('Нет открытых тикетов'))
        const lines = tickets.map(t => `#${t.id} от ${t.user_id}: ${t.subject} (${new Date(t.created_at).toLocaleString('ru-RU')})`)
        return res.json(say(lines.join('\n')))
      }
      case 'reply': {
        if (!args[0]) return res.json(say('Укажите ID тикета'))
        const text = args.slice(1).join(' ')
        if (!text) return res.json(say('Напишите ответ'))
        const ticket = await dbGet('SELECT * FROM support_tickets WHERE id = ?', args[0])
        if (!ticket) return res.json(say('Тикет не найден'))
        await dbRun('INSERT INTO support_messages (id, ticket_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)', uuidv4(), args[0], req.user.id, text, Date.now())
        await dbRun("UPDATE support_tickets SET status = 'answered' WHERE id = ?", args[0])
        return res.json(say(`Ответ отправлен в тикет #${args[0]}`))
      }
      default:
        return res.json(say(`Неизвестная команда: ${cmd}. Введите help для списка команд`))
    }
  } catch (err) {
    return res.json(say(`Ошибка: ${err.message}`))
  }
})

// ─── Users ───

app.get('/api/users/check-id/:userId', async (req, res) => {
  const cleanId = sanitizeUserId(req.params.userId)
  if (cleanId.length < 3) return res.json({ available: false })
  const existing = await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)
  res.json({ available: !existing, userId: cleanId })
})

app.get('/api/users/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json({ users: [] })

  const users = await dbAll(`
    SELECT id, user_id, name, phone, avatar FROM users
    WHERE (user_id LIKE ? OR phone LIKE ?) AND is_system = 0 AND id != ?
    LIMIT 20
  `, `${q}%`, `${q}%`, req.user.id)

  res.json({ users: users.map((u) => ({ id: u.id, userId: u.user_id, name: u.name, phone: u.phone, avatar: resolveMediaUrl(req, u.avatar) })) })
})

app.get('/api/users/:userId', authMiddleware, async (req, res) => {
  const cleanId = sanitizeUserId(req.params.userId)
  const user = await dbGet('SELECT id, user_id, name, is_system, avatar, birthday, gender, profile_color, profile_banner, subscription_plan, subscription_until, is_verified, verify_type, music FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Не найден' })
  const mutual = await dbAll(`
    SELECT cp.chat_id FROM chat_participants cp
    WHERE cp.user_id = ? AND cp.chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = ?
    )
  `, user.id, req.user.id)
  const hasPlus = !!user.subscription_plan && user.subscription_until > Date.now()
  res.json({
    user: {
      id: user.id, userId: user.user_id, name: user.name, isSystem: !!user.is_system,
      avatar: resolveMediaUrl(req, user.avatar), birthday: user.birthday, gender: user.gender,
      profileColor: user.profile_color, banner: resolveMediaUrl(req, user.profile_banner),
      verified: !!user.is_verified, verifyType: user.verify_type,
      plus: hasPlus,
      music: user.music || null,
    },
    mutualChats: mutual.map(r => r.chat_id),
  })
})

app.patch('/api/user/profile', authMiddleware, async (req, res) => {
  const { birthday, gender, profileColor, name, userId, avatar, bio, music } = req.body
  if (birthday !== undefined) await dbRun('UPDATE users SET birthday = ? WHERE id = ?', birthday || null, req.user.id)
  if (gender !== undefined) await dbRun('UPDATE users SET gender = ? WHERE id = ?', gender || null, req.user.id)
  if (profileColor !== undefined) await dbRun('UPDATE users SET profile_color = ? WHERE id = ?', profileColor || null, req.user.id)
  if (name !== undefined) await dbRun('UPDATE users SET name = ? WHERE id = ?', name.trim(), req.user.id)
  if (avatar !== undefined) await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatar || null, req.user.id)
  if (music !== undefined) await dbRun('UPDATE users SET music = ? WHERE id = ?', music || null, req.user.id)
  if (bio !== undefined) {
    const sub = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
    const limits = getLimits(null, sub)
    if (bio.length > limits.maxBioLength) return res.status(400).json({ error: `Максимум ${limits.maxBioLength} символов` })
    await dbRun('UPDATE users SET bio = ? WHERE id = ?', bio || null, req.user.id)
  }
  if (userId !== undefined) {
    const sub = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
    if (!sub || !isSubActive(sub)) return res.status(403).json({ error: 'Смена ID доступна только с подпиской Plus' })
    const cleanId = sanitizeUserId(userId)
    const existing = await dbGet('SELECT id FROM users WHERE user_id = ? AND id != ?', cleanId, req.user.id)
    if (existing) return res.status(409).json({ error: 'Этот ID уже занят' })
    if (cleanId.length < 3) return res.status(400).json({ error: 'ID должен быть минимум 3 символа' })
    await dbRun('UPDATE users SET user_id = ? WHERE id = ?', cleanId, req.user.id)
  }
  const u = await dbGet('SELECT id, user_id, name, phone, bio, is_system, avatar, birthday, gender, profile_color, mcoins, subscription_plan, subscription_until, ai_model, music FROM users WHERE id = ?', req.user.id)
  res.json({ user: serializeUser(u, { req }) })
})

// ─── Verification ───

app.get('/api/verify/status', authMiddleware, async (req, res) => {
  const user = await dbGet('SELECT is_verified, verify_type FROM users WHERE id = ?', req.user.id)
  const request = await dbGet('SELECT id, verify_type, status, created_at FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', req.user.id)
  res.json({ verified: !!user?.is_verified, verifyType: user?.verify_type || 'msm', request: request || null })
})

app.post('/api/verify/request', authMiddleware, async (req, res) => {
  const { message, verifyType } = req.body
  const type = verifyType === 'dev' ? 'dev' : 'msm'
  const existing = await dbGet('SELECT id, status FROM verification_requests WHERE user_id = ? AND status = ? AND verify_type = ?', req.user.id, 'pending', type)
  if (existing) return res.status(400).json({ error: 'Заявка уже отправлена' })
  const user = await dbGet('SELECT is_verified, verify_type FROM users WHERE id = ?', req.user.id)
  if (user?.is_verified && user?.verify_type === type) return res.status(400).json({ error: 'Вы уже верифицированы' })
  const id = uuidv4()
  await dbRun('INSERT INTO verification_requests (id, user_id, message, verify_type, created_at) VALUES (?, ?, ?, ?, ?)', id, req.user.id, message || '', type, Date.now())
  res.json({ ok: true })
})

app.get('/api/admin/verify-requests', authMiddleware, adminMiddleware, async (req, res) => {
  const rows = await dbAll(`
    SELECT vr.id, vr.user_id, vr.message, vr.verify_type, vr.status, vr.created_at, u.user_id as user_handle, u.name as user_name, u.avatar as user_avatar
    FROM verification_requests vr
    JOIN users u ON u.id = vr.user_id
    ORDER BY vr.created_at DESC LIMIT 50
  `)
  res.json({ requests: rows })
})

app.post('/api/admin/verify/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const { requestId } = req.body
  const row = await dbGet('SELECT user_id, verify_type FROM verification_requests WHERE id = ?', requestId)
  if (!row) return res.status(404).json({ error: 'Заявка не найдена' })
  await dbRun("UPDATE users SET is_verified = 1, verify_type = ? WHERE id = ?", row.verify_type || 'msm', row.user_id)
  await dbRun('UPDATE verification_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?', 'approved', Date.now(), req.user.id, requestId)
  res.json({ ok: true })
})

app.post('/api/admin/verify/reject', authMiddleware, adminMiddleware, async (req, res) => {
  const { requestId } = req.body
  const row = await dbGet('SELECT user_id FROM verification_requests WHERE id = ?', requestId)
  if (!row) return res.status(404).json({ error: 'Заявка не найдена' })
  await dbRun('UPDATE verification_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?', 'rejected', Date.now(), req.user.id, requestId)
  res.json({ ok: true })
})

// ─── Contacts ───

app.get('/api/contacts', authMiddleware, async (req, res) => {
  const contacts = await dbAll(`
    SELECT u.id, u.user_id, u.name, u.is_system, u.avatar, c.created_at
    FROM contacts c
    JOIN users u ON u.id = c.contact_id
    WHERE c.user_id = ?
    ORDER BY u.name
  `, req.user.id)

  res.json({
    contacts: contacts.map((c) => ({
      id: c.id,
      userId: c.user_id,
      name: c.name,
      isSystem: !!c.is_system,
      avatar: resolveMediaUrl(req, c.avatar),
    })),
  })
})

app.post('/api/contacts', authMiddleware, async (req, res) => {
  const { userId } = req.body
  const cleanId = sanitizeUserId(userId)
  const contact = await dbGet('SELECT id, user_id, name, is_system, avatar FROM users WHERE user_id = ?', cleanId)
  if (!contact) return res.status(404).json({ error: 'Пользователь не найден' })
  if (contact.id === req.user.id) return res.status(400).json({ error: 'Нельзя добавить себя' })
  if (contact.is_system) return res.status(400).json({ error: 'Нельзя добавить системный аккаунт' })

  await dbRun('INSERT OR IGNORE INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)',
    req.user.id, contact.id, Date.now()
  )
  await dbRun('INSERT OR IGNORE INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)',
    contact.id, req.user.id, Date.now()
  )

  const chatId = await getOrCreateDirectChat(req.user.id, contact.id)
  res.json({
    contact: { id: contact.id, userId: contact.user_id, name: contact.name, isSystem: !!contact.is_system, avatar: resolveMediaUrl(req, contact.avatar) },
    chatId,
  })
})

// ─── Groups ───

app.post('/api/groups', authMiddleware, async (req, res) => {
  const { name, about } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Укажите название группы' })
  const id = uuidv4()
  const now = Date.now()
  await dbRun('INSERT INTO chats (id, type, name, about, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, 'group', name.trim(), about || null, req.user.id, now
  )
  await dbRun('INSERT INTO chat_participants (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)',
    id, req.user.id, 'creator', now
  )
  res.json({ id, name: name.trim(), type: 'group' })
})

// ─── Channels ───

app.post('/api/channels', authMiddleware, async (req, res) => {
  const { name, about, settings } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Укажите название канала' })
  const id = uuidv4()
  const now = Date.now()
  const settingsJson = settings ? JSON.stringify(settings) : '{}'
  await dbRun('INSERT INTO chats (id, type, name, about, created_by, settings, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, 'channel', name.trim(), about || null, req.user.id, settingsJson, now
  )
  await dbRun('INSERT INTO chat_participants (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)',
    id, req.user.id, 'creator', now
  )
  res.json({ id, name: name.trim(), type: 'channel', settings: settings || {} })
})

app.get('/api/user/groups', authMiddleware, async (req, res) => {
  const rows = await dbAll(`
    SELECT c.id, c.name, c.about, c.avatar, c.created_by, c.settings
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ? AND c.type = 'group'
    ORDER BY c.name
  `, req.user.id)
  const groups = rows.map(r => ({
    id: r.id,
    name: r.name,
    about: r.about,
    avatar: resolveMediaUrl(req, r.avatar),
    createdBy: r.created_by,
    settings: tryParseJson(r.settings, {}),
    isLinked: !!(tryParseJson(r.settings, {}).linkedChannelId),
  }))
  res.json({ groups })
})

app.patch('/api/channels/:id/link-group', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { groupId } = req.body
  const chat = await dbGet('SELECT id, created_by, settings FROM chats WHERE id = ? AND type = \'channel\'', id)
  if (!chat) return res.status(404).json({ error: 'Канал не найден' })
  if (chat.created_by !== req.user.id) return res.status(403).json({ error: 'Нет доступа' })

  let settings = tryParseJson(chat.settings, {})
  settings.linkedChatId = groupId || null
  await dbRun('UPDATE chats SET settings = ? WHERE id = ?', JSON.stringify(settings), id)

  if (groupId) {
    let groupSettings = {}
    const group = await dbGet('SELECT settings FROM chats WHERE id = ?', groupId)
    if (group) groupSettings = tryParseJson(group.settings, {})
    groupSettings.linkedChannelId = id
    await dbRun('UPDATE chats SET settings = ? WHERE id = ?', JSON.stringify(groupSettings), groupId)
  }

  res.json({ ok: true, settings })
})

// ─── Uploads ───

function tryParseJson(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

function fullUrl(req, path) {
  if (PUBLIC_URL) return `${PUBLIC_URL.replace(/\/$/, '')}${path}`
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = (req.headers['x-forwarded-host'] || req.get('host') || req.headers.host || '').replace(/:.*$/, '')
  if (host && !host.includes('0.0.0.0') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}${path}`
  }
  return `${path}`
}

// Convert a possibly-relative upload path into an absolute URL for the clients.
function resolveMediaUrl(req, url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return fullUrl(req, url)
  return url
}

// Serialize a user row into the camelCase shape the clients expect.
function serializeUser(u, opts = {}) {
  const { req, extra } = opts
  return {
    id: u.id,
    userId: u.user_id,
    name: u.name,
    phone: u.phone || null,
    bio: u.bio || null,
    isSystem: !!u.is_system,
    avatar: resolveMediaUrl(req, u.avatar),
    birthday: u.birthday || null,
    gender: u.gender || null,
    profileColor: u.profile_color || null,
    mcoins: u.mcoins || 0,
    isAdmin: !!extra?.is_admin,
    banned: !!extra?.banned,
    premium: isSubActive(u),
    aiModel: u.ai_model || 'lite',
    music: u.music || null,
  }
}

app.post('/api/upload/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  await dbRun('UPDATE users SET avatar = ? WHERE id = ?', url, req.user.id)
  res.json({ avatar: url })
})

app.post('/api/upload/attachment', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  const mime = req.file.mimetype || ''
  const type = mime.startsWith('image/') ? 'image'
    : mime.startsWith('video/') ? 'video'
    : mime.startsWith('audio/') ? 'voice'
    : 'file'
  const duration = req.body.duration ? parseInt(req.body.duration, 10) : null
  res.json({ url, type, name: req.file.originalname, size: req.file.size, duration })
})

app.patch('/api/users/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body
  await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatar || null, req.user.id)
  res.json({ avatar })
})

app.post('/api/chats/:chatId/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  const { chatId } = req.params
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const chat = await dbGet('SELECT id, created_by FROM chats WHERE id = ?', chatId)
  if (!chat) return res.status(404).json({ error: 'Чат не найден' })
  if (chat.created_by !== req.user.id) return res.status(403).json({ error: 'Нет доступа' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  await dbRun('UPDATE chats SET avatar = ? WHERE id = ?', url, chatId)
  res.json({ avatar: url })
})

// ─── Music Distribution ───

// Get my artist card (or null) + my tracks with statuses
app.get('/api/music/me', authMiddleware, async (req, res) => {
  const artist = await dbGet('SELECT id, user_id, name, photo, banner, created_at FROM artists WHERE user_id = ?', req.user.id)
  const tracks = artist ? await dbAll('SELECT * FROM music_tracks WHERE artist_id = ? ORDER BY created_at DESC', artist.id) : []
  res.json({
    artist: artist ? serializeArtist(artist, tracks) : null,
  })
})

app.post('/api/music/artist', authMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Введите никнейм артиста' })
  const existing = await dbGet('SELECT id FROM artists WHERE user_id = ?', req.user.id)
  if (existing) return res.status(409).json({ error: 'Карточка уже создана' })
  const photo = req.files?.photo?.[0] ? fullUrl(req, `/uploads/${req.files.photo[0].filename}`) : null
  const banner = req.files?.banner?.[0] ? fullUrl(req, `/uploads/${req.files.banner[0].filename}`) : null
  const id = uuidv4()
  await dbRun('INSERT INTO artists (id, user_id, name, photo, banner, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, req.user.id, name.trim(), photo, banner, Date.now())
  res.json({ artist: { id, userId: req.user.id, name: name.trim(), photo, banner, tracks: [] } })
})

// Upload a track (audio file + cover). Metadata in fields.
app.post('/api/music/track', authMiddleware, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const artist = await dbGet('SELECT * FROM artists WHERE user_id = ?', req.user.id)
  if (!artist) return res.status(403).json({ error: 'Сначала создайте карточку артиста' })
  const audio = req.files?.file?.[0]
  if (!audio) return res.status(400).json({ error: 'Аудиофайл не загружен' })
  const ext = path.extname(audio.originalname).toLowerCase()
  if (!['.mp3', '.wav'].includes(ext)) return res.status(400).json({ error: 'Только MP3 или WAV' })

  const { title, isPublic, releaseNow, scheduledAt } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Укажите название трека' })
  const cover = req.files?.cover?.[0] ? fullUrl(req, `/uploads/${req.files.cover[0].filename}`) : null
  const fileUrl = fullUrl(req, `/uploads/${audio.filename}`)
  const id = uuidv4()
  const status = 'moderation'
  await dbRun(`INSERT INTO music_tracks
    (id, artist_id, user_id, title, artist_name, format, file_url, cover_url, is_public, release_now, scheduled_at, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, artist.id, req.user.id, title.trim(), artist.name, ext.slice(1), fileUrl, cover,
    isPublic === 'true' || isPublic === true ? 1 : 0,
    releaseNow === 'false' || releaseNow === false ? 0 : 1,
    scheduledAt ? parseInt(scheduledAt, 10) : null,
    status, Date.now())
  res.json({ track: serializeTrack(req.body), id })
})

// Admin: list pending moderation
app.get('/api/admin/music/moderation', authMiddleware, adminMiddleware, async (req, res) => {
  const rows = await dbAll(`
    SELECT mt.*, u.user_id as submitter_handle
    FROM music_tracks mt
    LEFT JOIN users u ON u.id = mt.user_id
    WHERE mt.status = 'moderation'
    ORDER BY mt.created_at DESC
  `)
  res.json({ tracks: rows.map(serializeTrack) })
})

// Admin: list all tracks (with status filter)
app.get('/api/admin/music/tracks', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.query
  const where = status ? 'WHERE status = ?' : ''
  const rows = await dbAll(`SELECT * FROM music_tracks ${where} ORDER BY created_at DESC${status ? '' : ' LIMIT 100'}`, ...(status ? [status] : []))
  res.json({ tracks: rows.map(serializeTrack) })
})

// Admin: approve / reject track
app.post('/api/admin/music/review', authMiddleware, adminMiddleware, async (req, res) => {
  const { trackId, action } = req.body
  if (!trackId || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Bad request' })
  const track = await dbGet('SELECT * FROM music_tracks WHERE id = ?', trackId)
  if (!track) return res.status(404).json({ error: 'Трек не найден' })
  const newStatus = action === 'approve' ? 'published' : 'rejected'
  await dbRun("UPDATE music_tracks SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?", newStatus, Date.now(), req.user.id, trackId)
  res.json({ ok: true, status: newStatus })
})

// Public: search artists & published tracks
app.get('/api/music/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ artists: [], tracks: [] })
  const like = `%${q}%`
  const artists = await dbAll('SELECT * FROM artists WHERE name LIKE ? ORDER BY created_at DESC LIMIT 20', like)
  const tracks = await dbAll(`SELECT mt.* FROM music_tracks mt
    WHERE mt.status = 'published' AND (mt.title LIKE ? OR mt.artist_name LIKE ?)
    ORDER BY mt.created_at DESC LIMIT 20`, like, like)
  res.json({ artists: artists.map(a => serializeArtist(a)), tracks: tracks.map(serializeTrack) })
})

// Public: browse — published tracks only (excluding own if not published)
app.get('/api/music/browse', authMiddleware, async (req, res) => {
  const rows = await dbAll(`SELECT * FROM music_tracks WHERE status = 'published' ORDER BY created_at DESC LIMIT 50`)
  res.json({ tracks: rows.map(serializeTrack) })
})

function serializeArtist(a, tracks = []) {
  return {
    id: a.id,
    userId: a.user_id,
    name: a.name,
    photo: a.photo || null,
    banner: a.banner || null,
    createdAt: a.created_at,
    tracks: tracks.map(serializeTrack),
  }
}

function serializeTrack(t) {
  return {
    id: t.id,
    artistId: t.artist_id,
    userId: t.user_id,
    title: t.title,
    artist: t.artist_name || t.artist,
    format: t.format || 'mp3',
    fileUrl: t.file_url,
    cover: t.cover_url,
    isPublic: !!(t.is_public),
    releaseNow: !(t.release_now === 0),
    scheduledAt: t.scheduled_at || null,
    status: t.status || 'moderation',
    createdAt: t.created_at,
    reviewedAt: t.reviewed_at || null,
    reviewedBy: t.reviewed_by || null,
    submitterHandle: t.submitter_handle || null,
  }
}

// ─── Chats ───

app.get('/api/chats', authMiddleware, async (req, res) => {
  const chats = await dbAll(`
    SELECT c.id, c.type, c.name,
      (SELECT content_enc FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_enc,
      (SELECT content_iv FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_iv,
      (SELECT content_tag FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_tag,
      (SELECT created_at FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_time,
      (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.created_at > COALESCE(
        (SELECT last_read FROM chat_participants WHERE chat_id = c.id AND user_id = ?), 0
      )) as unread
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ?
    ORDER BY last_time DESC NULLS LAST
  `, req.user.id, req.user.id, req.user.id)

  const chatIds = chats.map((c) => c.id)
  const peers = chatIds.length > 0 ? await dbAll(`
    SELECT cp.chat_id, u.id, u.user_id, u.name, u.is_system, u.avatar, u.profile_color
    FROM chat_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.chat_id IN (${chatIds.map(() => '?').join(',')}) AND u.id != ?
  `, ...chatIds, req.user.id) : []

  const peerIds = [...new Set(peers.map((p) => p.id))]
  const lastSeenMap = new Map()
  if (peerIds.length > 0) {
    const devices = await dbAll(`
      SELECT user_id, MAX(last_seen) as last_seen FROM devices
      WHERE user_id IN (${peerIds.map(() => '?').join(',')})
      GROUP BY user_id
    `, ...peerIds)
    for (const d of devices) lastSeenMap.set(d.user_id, d.last_seen)
  }

  const peersByChat = new Map()
  for (const p of peers) {
    if (!peersByChat.has(p.chat_id)) peersByChat.set(p.chat_id, [])
    peersByChat.get(p.chat_id).push(p)
  }

  const result = chats.map((chat) => {
    const others = peersByChat.get(chat.id) || []
    const peer = others[0]
    let lastMessage = ''
    if (chat.last_enc) {
      try { lastMessage = decrypt(chat.last_enc, chat.last_iv, chat.last_tag) } catch { lastMessage = '🔒' }
    }

    let lastSeen = null
    if (peer && !isUserOnline(peer.id)) {
      lastSeen = lastSeenMap.get(peer.id) || null
    }

    return {
      id: chat.id,
      type: chat.type || 'direct',
      name: chat.type !== 'direct' ? chat.name : (peer?.name || 'Чат'),
      peer: peer ? { id: peer.id, userId: peer.user_id, name: peer.name, isSystem: !!peer.is_system, avatar: resolveMediaUrl(req, peer.avatar), profileColor: peer.profile_color, online: isUserOnline(peer.id), lastSeen } : null,
      lastMessage,
      lastTime: chat.last_time ? formatTime(chat.last_time) : '',
      unread: chat.unread || 0,
    }
  })

  res.json({ chats: result })
})

// ─── Messages ───

app.get('/api/chats/:chatId/messages', authMiddleware, async (req, res) => {
  const participant = await dbGet(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?',
    req.params.chatId, req.user.id
  )
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const rows = await dbAll(`
    SELECT * FROM messages WHERE chat_id = ? AND deleted = 0 ORDER BY created_at ASC
  `, req.params.chatId)

  const senderIds = [...new Set(rows.map((m) => m.sender_id))]
  const senders = senderIds.length > 0 ? await dbAll(`
    SELECT id, user_id, name, is_system, avatar FROM users WHERE id IN (${senderIds.map(() => '?').join(',')})
  `, ...senderIds) : []
  const senderMap = new Map(senders.map((s) => [s.id, s]))

  const msgIds = rows.map((m) => m.id)
  const reactions = msgIds.length > 0 ? await dbAll(`
    SELECT message_id, emoji, user_id FROM message_reactions WHERE message_id IN (${msgIds.map(() => '?').join(',')})
  `, ...msgIds) : []
  const reactionsMap = new Map()
  for (const r of reactions) {
    if (!reactionsMap.has(r.message_id)) reactionsMap.set(r.message_id, [])
    reactionsMap.get(r.message_id).push({ emoji: r.emoji, user_id: r.user_id })
  }

  const replyIds = [...new Set(rows.map((m) => m.reply_to).filter(Boolean))]
  const replyMap = new Map()
  if (replyIds.length > 0) {
    const replyRows = await dbAll(`
      SELECT * FROM messages WHERE id IN (${replyIds.map(() => '?').join(',')}) AND deleted = 0
    `, ...replyIds)
    const rsIds = [...new Set(replyRows.map((r) => r.sender_id))]
    const rsMap = new Map()
    if (rsIds.length > 0) {
      const rsRows = await dbAll(`SELECT id, name FROM users WHERE id IN (${rsIds.map(() => '?').join(',')})`, ...rsIds)
      for (const r of rsRows) rsMap.set(r.id, r)
    }
    for (const rm of replyRows) {
      let ra = null
      if (rm.attachment) {
        try { const a = JSON.parse(rm.attachment); ra = { type: a.type, name: a.name } } catch {}
      }
      replyMap.set(rm.id, {
        id: rm.id,
        senderName: rsMap.get(rm.sender_id)?.name || '…',
        text: decrypt(rm.content_enc, rm.content_iv, rm.content_tag),
        attachment: ra,
      })
    }
  }

  const readMap = new Map()
  const participants = await dbAll('SELECT user_id, last_read FROM chat_participants WHERE chat_id = ? AND user_id != ?', req.params.chatId, req.user.id)

  const messages = rows.map((m) => {
    const sender = senderMap.get(m.sender_id)
    let attachment = null
    if (m.attachment) {
      try { attachment = JSON.parse(m.attachment) } catch {}
    }
    let read = false
    if (participants.length > 0) {
      read = participants.some((p) => p.last_read && p.last_read >= m.created_at)
    }
    return {
      id: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      senderUserId: sender?.user_id,
      senderName: sender?.name,
      text: decrypt(m.content_enc, m.content_iv, m.content_tag),
      replyTo: m.reply_to,
      reply: m.reply_to ? replyMap.get(m.reply_to) || null : null,
      pinned: !!m.pinned,
      edited: !!m.edited_at,
      time: formatTime(m.created_at),
      createdAt: m.created_at,
      reactions: reactionsMap.get(m.id) || [],
      attachment,
      read,
      channelPostId: m.channel_post_id || null,
    }
  })
  res.json({ messages })
})

app.post('/api/chats/:chatId/messages', authMiddleware, async (req, res) => {
  const { text, replyTo, attachment: attach } = req.body
  if (!text?.trim() && !attach) return res.status(400).json({ error: 'Пустое сообщение' })

  const participant = await dbGet(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?',
    req.params.chatId, req.user.id
  )
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const msgId = uuidv4()
  const content = text?.trim() || '📎'
  const enc = encrypt(content)
  const now = Date.now()
  const attachment = attach ? JSON.stringify(attach) : null

  await dbRun(`
    INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, reply_to, attachment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, msgId, req.params.chatId, req.user.id, enc.content_enc, enc.content_iv, enc.content_tag, replyTo || null, attachment, now)

  const message = await formatMessage(msgId, req.user.id)
  await broadcastToChat(req.params.chatId, { type: 'new_message', chatId: req.params.chatId, message }, req.user.id)

  const chatRow = await dbGet('SELECT * FROM chats WHERE id = ?', req.params.chatId)

  // Auto-forward channel posts to linked discussion group
  if (chatRow && chatRow.type === 'channel') {
    const settings = tryParseJson(chatRow.settings, {})
    const linkedChatId = settings.linkedChatId
    if (linkedChatId) {
      try {
        const fwdEnc = encrypt(content)
        const fwdId = uuidv4()
        const fwdAttach = attachment
        const fwdNow = Date.now()
        await dbRun(
          'INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, attachment, channel_post_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          fwdId, linkedChatId, req.user.id, fwdEnc.content_enc, fwdEnc.content_iv, fwdEnc.content_tag, fwdAttach, msgId, fwdNow
        )
        if (settings.pinPosts) {
          await dbRun('UPDATE messages SET pinned = 1 WHERE id = ?', fwdId)
        }
        const fwdMessage = await formatMessage(fwdId, req.user.id)
        await broadcastToChat(linkedChatId, { type: 'new_message', chatId: linkedChatId, message: fwdMessage })
      } catch (e) {
        console.error('Forward to discussion group failed:', e.message)
      }
    }
  }

  // AI Assistant auto-reply
  if (chatRow && chatRow.type === 'direct') {
    const otherParticipant = await dbGet(
      'SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ?',
      req.params.chatId, req.user.id
    )
    if (otherParticipant && (otherParticipant.user_id === AI_ASSISTANT.id || otherParticipant.user_id === AI_ASSISTANT.user_id)) {
      // Don't reply to empty/attachment-only messages
      if (text?.trim()) {
        const aiResponse = await callAiApi(content, req.user.id)
        await sendAiMessage(req.params.chatId, AI_ASSISTANT.id, req.user.id, aiResponse)
      }
    }
  }

  res.json({ message })
})

// Get comments (replies in discussion group) for a channel post
app.get('/api/channels/:channelId/comments/:postId', authMiddleware, async (req, res) => {
  const { channelId, postId } = req.params
  const chat = await dbGet('SELECT id, settings FROM chats WHERE id = ?', channelId)
  if (!chat) return res.status(404).json({ error: 'Канал не найден' })
  const settings = tryParseJson(chat.settings, {})
  const linkedChatId = settings.linkedChatId
  if (!linkedChatId) return res.json({ comments: [] })

  // Find the forwarded message in discussion group (channel_post_id = postId)
  const fwdMsg = await dbGet(
    'SELECT id FROM messages WHERE chat_id = ? AND channel_post_id = ? AND deleted = 0',
    linkedChatId, postId
  )
  if (!fwdMsg) return res.json({ comments: [] })

  // Get replies to the forwarded message
  const rows = await dbAll(
    'SELECT * FROM messages WHERE chat_id = ? AND reply_to = ? AND deleted = 0 ORDER BY created_at ASC',
    linkedChatId, fwdMsg.id
  )
  const senderIds = [...new Set(rows.map(m => m.sender_id))]
  const senders = senderIds.length > 0 ? await dbAll(
    `SELECT id, user_id, name FROM users WHERE id IN (${senderIds.map(() => '?').join(',')})`,
    ...senderIds
  ) : []
  const senderMap = new Map(senders.map(s => [s.id, s]))

  const comments = rows.map(m => {
    const sender = senderMap.get(m.sender_id)
    return {
      id: m.id,
      senderId: m.sender_id,
      senderUserId: sender?.user_id,
      senderName: sender?.name,
      text: decrypt(m.content_enc, m.content_iv, m.content_tag),
      time: formatTime(m.created_at),
      createdAt: m.created_at,
    }
  })
  res.json({ comments })
})

// Get comment counts for all posts in a channel
app.get('/api/channels/:channelId/comment-counts', authMiddleware, async (req, res) => {
  const { channelId } = req.params
  const chat = await dbGet('SELECT id, settings FROM chats WHERE id = ?', channelId)
  if (!chat) return res.status(404).json({ error: 'Канал не найден' })
  const settings = tryParseJson(chat.settings, {})
  const linkedChatId = settings.linkedChatId
  if (!linkedChatId) return res.json({ counts: {} })

  // Get all forwarded messages in the discussion group
  const fwdRows = await dbAll(
    'SELECT id, channel_post_id FROM messages WHERE chat_id = ? AND channel_post_id IS NOT NULL AND deleted = 0',
    linkedChatId
  )
  const fwdIds = fwdRows.map(r => r.id)
  const fwdMap = new Map(fwdRows.map(r => [r.channel_post_id, r.id]))

  if (fwdIds.length === 0) return res.json({ counts: {} })

  // Count replies for each forwarded message
  const counts = {}
  for (const fwd of fwdRows) {
    const result = await dbGet(
      'SELECT COUNT(*) as cnt FROM messages WHERE chat_id = ? AND reply_to = ? AND deleted = 0',
      linkedChatId, fwd.id
    )
    counts[fwd.channel_post_id] = result?.cnt || 0
  }
  res.json({ counts })
})

app.patch('/api/messages/:id', authMiddleware, async (req, res) => {
  const { text } = req.body
  const msg = await dbGet('SELECT * FROM messages WHERE id = ?', req.params.id)
  if (!msg || msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Нельзя редактировать' })

  const enc = encrypt(text.trim())
  await dbRun(`
    UPDATE messages SET content_enc = ?, content_iv = ?, content_tag = ?, edited_at = ? WHERE id = ?
  `, enc.content_enc, enc.content_iv, enc.content_tag, Date.now(), req.params.id)

  const message = await formatMessage(req.params.id, req.user.id)
  await broadcastToChat(msg.chat_id, { type: 'message_updated', message })
  res.json({ message })
})

app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  const msg = await dbGet('SELECT * FROM messages WHERE id = ?', req.params.id)
  if (!msg || msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Нельзя удалить' })

  await dbRun('UPDATE messages SET deleted = 1 WHERE id = ?', req.params.id)
  await broadcastToChat(msg.chat_id, { type: 'message_deleted', messageId: req.params.id, chatId: msg.chat_id })
  res.json({ ok: true })
})

app.post('/api/messages/:id/pin', authMiddleware, async (req, res) => {
  const msg = await dbGet('SELECT * FROM messages WHERE id = ?', req.params.id)
  if (!msg) return res.status(404).json({ error: 'Не найдено' })

  await dbRun('UPDATE messages SET pinned = ? WHERE id = ?', msg.pinned ? 0 : 1, req.params.id)
  res.json({ pinned: !msg.pinned })
})

app.post('/api/messages/:id/react', authMiddleware, async (req, res) => {
  const { emoji } = req.body
  const msg = await dbGet('SELECT id FROM messages WHERE id = ?', req.params.id)
  if (!msg) return res.status(404).json({ error: 'Не найдено' })

  const existing = await dbGet('SELECT emoji FROM message_reactions WHERE message_id = ? AND user_id = ?', req.params.id, req.user.id)
  if (existing?.emoji === emoji) {
    await dbRun('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?', req.params.id, req.user.id)
  } else {
    await dbRun('INSERT OR REPLACE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
      req.params.id, req.user.id, emoji
    )
  }

  const reactions = await dbAll('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?', req.params.id)
  res.json({ reactions })
})

app.post('/api/chats/:chatId/read', authMiddleware, async (req, res) => {
  const participant = await dbGet(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?',
    req.params.chatId, req.user.id
  )
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const now = Date.now()
  await dbRun('UPDATE chat_participants SET last_read = ? WHERE chat_id = ? AND user_id = ?',
    now, req.params.chatId, req.user.id
  )

  await broadcastToChat(req.params.chatId, {
    type: 'read_receipt',
    chatId: req.params.chatId,
    userId: req.user.id,
    lastRead: now,
  }, req.user.id)

  res.json({ ok: true })
})

app.post('/api/messages/:id/favorite', authMiddleware, async (req, res) => {
  await dbRun('INSERT OR IGNORE INTO favorites (user_id, message_id, created_at) VALUES (?, ?, ?)',
    req.user.id, req.params.id, Date.now()
  )
  res.json({ ok: true })
})

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/health')) {
    return next()
  }

  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath)
  }

  res.status(404).send('Frontend build not found. Run npm run build first.')
})

// ─── Gifts ───

app.get('/api/gifts', async (req, res) => {
  const gifts = await dbAll('SELECT * FROM gifts ORDER BY id')
  res.json({ gifts })
})

app.post('/api/gifts/send', authMiddleware, async (req, res) => {
  const { userId, giftId, message } = req.body
  const cleanId = sanitizeUserId(userId)
  const recipient = await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)
  if (!recipient) return res.status(404).json({ error: 'Пользователь не найден' })
  if (recipient.id === req.user.id) return res.status(400).json({ error: 'Нельзя подарить себе' })
  const gift = await dbGet('SELECT * FROM gifts WHERE id = ?', giftId)
  if (!gift) return res.status(404).json({ error: 'Подарок не найден' })
  
  // Check and deduct mcoins
  const sender = await dbGet('SELECT id, user_id, name, mcoins FROM users WHERE id = ?', req.user.id)
  if ((sender.mcoins || 0) < gift.price) {
    return res.status(400).json({ error: 'Недостаточно McoinS' })
  }
  await dbRun('UPDATE users SET mcoins = mcoins - ? WHERE id = ?', gift.price, sender.id)
  
  const id = uuidv4()
  await dbRun('INSERT INTO user_gifts (id, user_id, gift_id, sender_id, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, recipient.id, giftId, req.user.id, message || null, Date.now()
  )
  res.json({ gift: { id, gift, sender: { userId: sender.user_id, name: sender.name }, message, createdAt: Date.now() }, mcoins: (sender.mcoins || 0) - gift.price })
})

app.get('/api/users/:userId/gifts', authMiddleware, async (req, res) => {
  const cleanId = sanitizeUserId(req.params.userId)
  const user = await dbGet('SELECT id FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Не найден' })
  const rows = await dbAll(`
    SELECT ug.id, ug.gift_id, ug.message, ug.created_at,
      g.emoji, g.title,
      s.user_id as sender_user_id, s.name as sender_name
    FROM user_gifts ug
    JOIN gifts g ON g.id = ug.gift_id
    LEFT JOIN users s ON s.id = ug.sender_id
    WHERE ug.user_id = ?
    ORDER BY ug.created_at DESC
  `, user.id)
  res.json({
    gifts: rows.map((r) => ({
      id: r.id,
      gift: { id: r.gift_id, emoji: r.emoji, title: r.title },
      sender: r.sender_user_id ? { userId: r.sender_user_id, name: r.sender_name } : null,
      message: r.message,
      createdAt: r.created_at,
    })),
  })
})

// ─── McoinS ───

app.get('/api/user/mcoins', authMiddleware, async (req, res) => {
  const row = await dbGet('SELECT mcoins FROM users WHERE id = ?', req.user.id)
  res.json({ mcoins: row?.mcoins || 0 })
})

app.post('/api/mcoins/earn', authMiddleware, async (req, res) => {
  const { clicks } = req.body
  if (!clicks || clicks < 1 || clicks > 10000) return res.status(400).json({ error: 'Неверное количество' })
  const earned = Math.floor(clicks / 100) * 10
  if (earned < 1) return res.status(400).json({ error: 'Минимум 100 кликов' })
  await dbRun('UPDATE users SET mcoins = mcoins + ? WHERE id = ?', earned, req.user.id)
  const row = await dbGet('SELECT mcoins FROM users WHERE id = ?', req.user.id)
  res.json({ earned, mcoins: row?.mcoins || 0 })
})

// ─── Subscriptions (Plus/Premium) ───

function formatSubscription(user) {
  const plan = SUBSCRIPTION_PLANS[user.subscription_plan]
  return {
    plan: user.subscription_plan || null,
    planName: plan?.name || null,
    active: !!user.subscription_plan && user.subscription_until > Date.now(),
    until: user.subscription_until || null,
    daysLeft: user.subscription_plan ? Math.max(0, Math.floor(((user.subscription_until || 0) - Date.now()) / 86400000)) : 0,
  }
}

app.get('/api/subscriptions/status', authMiddleware, async (req, res) => {
  const user = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  res.json(formatSubscription(user))
})

app.post('/api/subscriptions/activate', authMiddleware, async (req, res) => {
  const { code } = req.body
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Укажите код' })
  const row = await dbGet('SELECT * FROM subscription_codes WHERE code = ?', code.trim())
  if (!row) return res.status(404).json({ error: 'Код не найден' })
  if (row.used_by) return res.status(400).json({ error: 'Код уже использован' })
  const now = Date.now()
  await dbRun('UPDATE subscription_codes SET used_by = ?, used_at = ? WHERE code = ?', req.user.id, now, code)
  const existing = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  const currentUntil = (existing.subscription_until && existing.subscription_until > now) ? existing.subscription_until : now
  const newUntil = currentUntil + row.duration_days * 86400000
  await dbRun('UPDATE users SET subscription_plan = ?, subscription_until = ? WHERE id = ?', row.plan, newUntil, req.user.id)
  res.json({ ok: true, ...formatSubscription({ subscription_plan: row.plan, subscription_until: newUntil }) })
})

// ─── SBP (СБП-оплата по QR на личный телефон) ───
// Работает без ИП: покупатель сканирует QR из банковского приложения получателя
// и переводит сумму. Конфигурация через env:
//   SBP_PHONE          — номер телефона (формат 79xxxxxxxxx) для перевода
//   SBP_BANK           — название банка получателя (опционально)
//   SBP_QR_IMAGE_URL   — URL готовой картинки QR или подписи (опционально;
//                        если нет — приложение сгенерит QR из телефона+суммы)
// Если ничего не задано — включается демо-режим (мгновенная активация).
const SBP_PHONE = process.env.SBP_PHONE || ''
const SBP_BANK = process.env.SBP_BANK || ''
const SBP_QR_IMAGE_URL = process.env.SBP_QR_IMAGE_URL || ''
const SBP_ENABLED = !!(SBP_PHONE || SBP_QR_IMAGE_URL)
const SBP_DEMO = !SBP_ENABLED

app.get('/api/subscriptions/plans', authMiddleware, (req, res) => {
  res.json({
    method: 'sbp',
    enabled: SBP_ENABLED,
    demoMode: SBP_DEMO,
    currency: 'RUB',
    phone: SBP_PHONE || null,
    bank: SBP_BANK || null,
    qrImageUrl: SBP_QR_IMAGE_URL || null,
    plans: Object.entries(SUBSCRIPTION_PLANS).map(([key, p]) => ({
      key,
      name: p.name,
      durationDays: p.durationDays,
      priceRub: Math.round(p.priceCents / 100),
    })),
  })
})

// Создание СБП-покупки. В демо-режиме (нет номера телефона) — мгновенная активация.
app.post('/api/subscriptions/purchase', authMiddleware, async (req, res) => {
  const { plan } = req.body
  if (!plan || !SUBSCRIPTION_PLANS[plan]) return res.status(400).json({ error: 'Неверный план' })
  const p = SUBSCRIPTION_PLANS[plan]
  const purchaseId = uuidv4()
  const now = Date.now()
  if (SBP_DEMO) {
    try {
      await dbRun(
        'INSERT INTO subscription_purchases (id, user_id, plan, provider, provider_token, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        purchaseId, req.user.id, plan, 'sbp', null, p.priceCents, 'RUB', 'completed', now
      )
      const existing = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
      const currentUntil = (existing.subscription_until && existing.subscription_until > now) ? existing.subscription_until : now
      const newUntil = currentUntil + p.durationDays * 86400000
      await dbRun('UPDATE users SET subscription_plan = ?, subscription_until = ? WHERE id = ?', plan, newUntil, req.user.id)
      res.json({ ok: true, demo: true, ...formatSubscription({ subscription_plan: plan, subscription_until: newUntil }) })
      return
    } catch (err) {
      return res.status(500).json({ error: 'Ошибка оформления (демо)' })
    }
  }
  try {
    await dbRun(
      'INSERT INTO subscription_purchases (id, user_id, plan, provider, provider_token, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      purchaseId, req.user.id, plan, 'sbp', purchaseId, p.priceCents, 'RUB', 'pending', now
    )
    res.json({
      ok: true,
      demo: false,
      purchaseId,
      phone: SBP_PHONE || null,
      bank: SBP_BANK || null,
      qrImageUrl: SBP_QR_IMAGE_URL || null,
      amountRub: Math.round(p.priceCents / 100),
      plan,
      planName: p.name,
      provider: 'sbp',
    })
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания заказа' })
  }
})

// Подтверждение после ручного СБП-перевода ("Я оплатил")
app.post('/api/subscriptions/confirm', authMiddleware, async (req, res) => {
  const { purchaseId } = req.body
  if (!purchaseId) return res.status(400).json({ error: 'Нет id заказа' })
  const row = await dbGet('SELECT * FROM subscription_purchases WHERE id = ? AND user_id = ?', purchaseId, req.user.id)
  if (!row || row.status !== 'pending') return res.status(404).json({ error: 'Заказ не найден или уже обработан' })
  const plan = row.plan
  const p = SUBSCRIPTION_PLANS[plan]
  if (!p) return res.status(400).json({ error: 'Неверный план' })
  const now = Date.now()
  await dbRun("UPDATE subscription_purchases SET status = 'completed' WHERE id = ?", purchaseId)
  const existing = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  const currentUntil = (existing.subscription_until && existing.subscription_until > now) ? existing.subscription_until : now
  const newUntil = currentUntil + p.durationDays * 86400000
  await dbRun('UPDATE users SET subscription_plan = ?, subscription_until = ? WHERE id = ?', plan, newUntil, req.user.id)
  res.json({ ok: true, ...formatSubscription({ subscription_plan: plan, subscription_until: newUntil }) })
})

// Просмотр своих СБП-заказов (опционально)
app.get('/api/subscriptions/orders', authMiddleware, async (req, res) => {
  const rows = await dbAll('SELECT id, plan, amount, status, created_at FROM subscription_purchases WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', req.user.id)
  res.json({ orders: rows.map(r => ({ ...r })) })
})

// ─── Plus: Profile (Change ID, Banner) ───

app.post('/api/users/change-id', authMiddleware, requirePlus, async (req, res) => {
  const { newId } = req.body
  if (!newId || typeof newId !== 'string') return res.status(400).json({ error: 'Укажите новый ID' })
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(newId)) return res.status(400).json({ error: 'ID: 3-30 символов, буквы/цифры/_-' })
  const existing = await dbGet('SELECT id FROM users WHERE user_id = ?', newId)
  if (existing) return res.status(409).json({ error: 'Этот ID уже занят' })
  await dbRun('UPDATE users SET user_id = ? WHERE id = ?', newId, req.user.id)
  res.json({ ok: true, user_id: newId })
})

app.post('/api/users/banner', authMiddleware, requirePlus, upload.single('banner'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  await dbRun('UPDATE users SET profile_banner = ? WHERE id = ?', url, req.user.id)
  res.json({ ok: true, banner: url })
})

app.delete('/api/users/banner', authMiddleware, requirePlus, async (req, res) => {
  await dbRun('UPDATE users SET profile_banner = NULL WHERE id = ?', req.user.id)
  res.json({ ok: true })
})

// ─── Plus: Disappearing Messages ───

app.get('/api/chats/:chatId/disappearing', authMiddleware, async (req, res) => {
  const chat = await dbGet('SELECT disappearing_interval FROM chats WHERE id = ?', req.params.chatId)
  if (!chat) return res.status(404).json({ error: 'Чат не найден' })
  res.json({ interval: chat.disappearing_interval || 0 })
})

app.patch('/api/chats/:chatId/disappearing', authMiddleware, requirePlus, async (req, res) => {
  const { interval } = req.body
  const valid = [0, 5, 30, 60, 360, 1440, 10080]
  if (!valid.includes(interval)) return res.status(400).json({ error: 'Интервал: 0(выкл), 5мин, 30мин, 1ч, 6ч, 24ч, 7дн' })
  const chat = await dbGet('SELECT id FROM chats WHERE id = ?', req.params.chatId)
  if (!chat) return res.status(404).json({ error: 'Чат не найден' })
  await dbRun('UPDATE chats SET disappearing_interval = ? WHERE id = ?', interval || null, req.params.chatId)
  res.json({ ok: true, interval })
})

// cleanup expired messages (called periodically)
async function cleanupDisappearingMessages() {
  try {
    const chats = await dbAll('SELECT id, disappearing_interval FROM chats WHERE disappearing_interval IS NOT NULL')
    for (const chat of chats) {
      const cutoff = Date.now() - chat.disappearing_interval * 60 * 1000
      await dbRun("UPDATE messages SET deleted = 1 WHERE chat_id = ? AND created_at < ? AND deleted = 0 AND pinned = 0", chat.id, cutoff)
    }
  } catch {}
}

// ─── Plus: Call Log ───

app.post('/api/call/log', authMiddleware, requirePlus, async (req, res) => {
  const { calleeId, chatId, type, status, duration } = req.body
  if (!calleeId) return res.status(400).json({ error: 'Укажите calleeId' })
  const callee = await dbGet('SELECT id FROM users WHERE user_id = ?', calleeId)
  if (!callee) return res.status(404).json({ error: 'Калли не найден' })
  const id = uuidv4()
  const now = Date.now()
  await dbRun(
    'INSERT INTO call_log (id, caller_id, callee_id, chat_id, type, status, duration, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, req.user.id, callee.id, chatId || null, type || 'audio', status || 'missed', duration || 0, now, status === 'ended' ? now : null
  )
  res.json({ ok: true, callId: id })
})

app.get('/api/call/history', authMiddleware, requirePlus, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const rows = await dbAll(`SELECT c.*, u.user_id AS caller_name, u2.user_id AS callee_name
    FROM call_log c
    JOIN users u ON u.id = c.caller_id
    JOIN users u2 ON u2.id = c.callee_id
    WHERE c.caller_id = ? OR c.callee_id = ?
    ORDER BY c.started_at DESC LIMIT ? OFFSET ?`, req.user.id, req.user.id, limit, offset)
  res.json({ calls: rows })
})

// ─── Plus: Sticker Packs ───

app.get('/api/stickers/packs', authMiddleware, async (req, res) => {
  const packs = await dbAll('SELECT * FROM sticker_packs ORDER BY created_at DESC')
  for (const p of packs) {
    try { p.stickers = JSON.parse(p.stickers || '[]') } catch { p.stickers = [] }
  }
  res.json({ packs })
})

app.post('/api/stickers/purchase', authMiddleware, requirePlus, async (req, res) => {
  const { packId } = req.body
  if (!packId) return res.status(400).json({ error: 'Укажите packId' })
  const pack = await dbGet('SELECT * FROM sticker_packs WHERE id = ?', packId)
  if (!pack) return res.status(404).json({ error: 'Пак не найден' })
  const owned = await dbGet('SELECT 1 FROM user_sticker_packs WHERE user_id = ? AND pack_id = ?', req.user.id, packId)
  if (owned) return res.status(400).json({ error: 'Уже куплен' })
  await dbRun('INSERT INTO user_sticker_packs (user_id, pack_id, purchased_at) VALUES (?, ?, ?)', req.user.id, packId, Date.now())
  res.json({ ok: true })
})

app.get('/api/stickers/my', authMiddleware, async (req, res) => {
  const rows = await dbAll(`SELECT sp.* FROM sticker_packs sp
    JOIN user_sticker_packs usp ON usp.pack_id = sp.id
    WHERE usp.user_id = ?`, req.user.id)
  for (const p of rows) {
    try { p.stickers = JSON.parse(p.stickers || '[]') } catch { p.stickers = [] }
  }
  res.json({ packs: rows })
})

app.post('/api/stickers/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  res.json({ url })
})

app.post('/api/stickers/create', authMiddleware, async (req, res) => {
  const { title, stickers } = req.body
  if (!title || !stickers?.length) return res.status(400).json({ error: 'Укажите название и стикеры' })
  const id = uuidv4()
  await dbRun('INSERT INTO sticker_packs (id, title, author, stickers, price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, title, req.user.id, JSON.stringify(stickers), 0, Date.now())
  await dbRun('INSERT INTO user_sticker_packs (user_id, pack_id, purchased_at) VALUES (?, ?, ?)',
    req.user.id, id, Date.now())
  res.json({ ok: true, packId: id })
})

app.get('/api/stickers/all', authMiddleware, async (req, res) => {
  const packs = await dbAll('SELECT * FROM sticker_packs ORDER BY created_at DESC')
  for (const p of packs) {
    try { p.stickers = JSON.parse(p.stickers || '[]') } catch { p.stickers = [] }
    p.owned = !!(await dbGet('SELECT 1 FROM user_sticker_packs WHERE user_id = ? AND pack_id = ?', req.user.id, p.id))
  }
  res.json({ packs })
})

// ─── Plus: Support Tickets ───

app.get('/api/support/tickets', authMiddleware, requirePlus, async (req, res) => {
  const tickets = await dbAll('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC', req.user.id)
  for (const t of tickets) {
    t.messages = await dbAll('SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC', t.id)
  }
  res.json({ tickets })
})

app.post('/api/support/tickets', authMiddleware, requirePlus, async (req, res) => {
  const { subject, content } = req.body
  if (!subject || !content) return res.status(400).json({ error: 'Укажите тему и текст' })
  const id = uuidv4()
  const now = Date.now()
  await dbRun('INSERT INTO support_tickets (id, user_id, subject, status, created_at) VALUES (?, ?, ?, ?, ?)', id, req.user.id, subject, 'open', now)
  await dbRun('INSERT INTO support_messages (id, ticket_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)', uuidv4(), id, req.user.id, content, now)
  res.json({ ok: true, ticketId: id })
})

app.post('/api/support/tickets/:id/messages', authMiddleware, requirePlus, async (req, res) => {
  const ticket = await dbGet('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
  if (!ticket) return res.status(404).json({ error: 'Тикет не найден' })
  const { content } = req.body
  if (!content) return res.status(400).json({ error: 'Напишите сообщение' })
  await dbRun('INSERT INTO support_messages (id, ticket_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)', uuidv4(), req.params.id, req.user.id, content, Date.now())
  res.json({ ok: true })
})

// auto cleanup disappearing messages every 5 minutes
setInterval(cleanupDisappearingMessages, 5 * 60 * 1000)

// Prevent crash on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

// Express error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Файл слишком большой (макс 20 МБ)' })
  }
  if (err.message === 'Недопустимый формат файла') {
    return res.status(400).json({ error: err.message })
  }
  console.error('Express error:', err)
  res.status(500).json({ error: 'Ошибка сервера' })
})

// ─── WebSocket ───

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  if (!token) { ws.close(); return }

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    dbGet('SELECT * FROM sessions WHERE token = ?', token).then(async (session) => {
      if (!session || session.expires_at < Date.now()) { ws.close(); return }

      ws.userId = payload.userId
      ws.token = token
      clients.set(token, ws)

      const contacts = await dbAll(`
        SELECT DISTINCT cp2.user_id FROM chat_participants cp1
        JOIN chat_participants cp2 ON cp2.chat_id = cp1.chat_id
        WHERE cp1.user_id = ? AND cp2.user_id != ?
      `, payload.userId, payload.userId)
      for (const c of contacts) {
        broadcastToUser(c.user_id, { type: 'user_online', userId: payload.userId })
      }

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString())
          if (data.type === 'typing') {
            dbAll('SELECT user_id FROM chat_participants WHERE chat_id = ?', data.chatId).then((participants) => {
              for (const p of participants) {
                if (p.user_id !== payload.userId) {
                  broadcastToUser(p.user_id, { type: 'typing', chatId: data.chatId, userId: payload.userId, isTyping: data.isTyping })
                }
              }
            }).catch(() => {})
          }
        } catch {}
      })

      ws.on('close', () => {
        clients.delete(token)
        const stillOnline = Array.from(clients.values()).some((c) => c.userId === payload.userId)
        if (!stillOnline) {
          for (const c of contacts) {
            broadcastToUser(c.user_id, { type: 'user_offline', userId: payload.userId })
          }
        }
      })
      ws.send(JSON.stringify({ type: 'connected' }))
    }).catch(() => {
      ws.close()
    })
  } catch {
    ws.close()
  }
})

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate()
    ws.isAlive = false
    ws.ping()
  })
}, 30000)
wss.on('close', () => clearInterval(heartbeat))

// ─── AI Chat ───

const AI_LITE_URL = process.env.AI_LITE_URL || ''
const AI_PRO_URL = process.env.AI_PRO_URL || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

async function callAiApi(question, userId) {
  const user = await dbGet('SELECT ai_model, subscription_plan, subscription_until FROM users WHERE id = ?', userId)
  const model = user?.ai_model || 'lite'
  const isPremium = isSubActive(user)

  if (model === 'pro' && !isPremium) {
    return 'Модель Pro доступна только для Premium-подписчиков. Вы можете переключиться на Lite в настройках.'
  }

  // 1) Self-hosted URL (custom HF Space / Gradio)
  const selfHostedUrl = model === 'pro' ? AI_PRO_URL : AI_LITE_URL
  if (selfHostedUrl) {
    try {
      const res = await fetch(`${selfHostedUrl}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (res.ok) { const d = await res.json(); if (d.response) return d.response }
    } catch {}
    try {
      const res = await fetch(`${selfHostedUrl}/api/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [question, []] }),
      })
      if (res.ok) { const d = await res.json(); if (d?.data?.[0]) return d.data[0] }
    } catch {}
  }

  // 2) Google Gemini API (free tier) — пробуем несколько актуальных моделей
  const geminiCandidates = model === 'pro'
    ? ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']
    : ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-lite', 'gemini-1.5-flash']
  const aiLog = [`GEMINI_KEY=${GEMINI_API_KEY ? 'set' : 'MISSING'}`]
  if (GEMINI_API_KEY) {
    for (const geminiModel of geminiCandidates) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Ты — MS Assistant, официальный AI-помощник мессенджера MS Messenger. Отвечай коротко и по делу на русском языке.\n\nВопрос: ${question}` }],
            }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
        }),
      })
      aiLog.push(`${geminiModel}=HTTP ${res.status}`)
      if (res.ok) {
        const d = await res.json()
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text.trim()
      } else {
        const errd = await res.json().catch(() => null)
        const errMsg = errd?.error?.message || ''
        if (!/not found|does not exist|model/i.test(errMsg)) break
      }
    } catch (e) { aiLog.push(`gemini ERR ${e.message}`) }
    }
  }

  // 2.5) Pollinations AI (бесплатно, без ключа)
  const pollinationsPrompt = `Ты — MS Assistant, официальный AI-помощник мессенджера MS Messenger. Отвечай коротко и по делу на русском языке. Вопрос: ${question}`
  try {
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 40000)
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(pollinationsPrompt)}`, {
      signal: ctrl.signal,
    })
    clearTimeout(tm)
    aiLog.push(`pollinations=HTTP ${res.status}`)
    if (res.ok) {
      const text = (await res.text()).trim()
      if (text && text.length < 4000) return text
    }
  } catch (e) { aiLog.push(`pollinations ERR ${e.message}`) }

  // 3) Hugging Face Inference API
  try {
    const hfModel = model === 'pro' ? 'Qwen/Qwen2.5-7B-Instruct' : 'TinyLlama/TinyLlama-1.1B-Chat-v1.0'
    const headers = { 'Content-Type': 'application/json' }
    if (process.env.HF_TOKEN) headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`
    const prompt = `<|user|>\n${question}\n<|assistant|>\n`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
      method: 'POST', headers,
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256, temperature: 0.7 } }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    aiLog.push(`hf=HTTP ${res.status}`)
    if (res.ok) {
      const d = await res.json()
      const gen = Array.isArray(d) ? d[0]?.generated_text : d?.generated_text
      if (gen) { const a = gen.replace(prompt, '').trim(); if (a) return a }
    }
  } catch (e) { aiLog.push(`hf ERR ${e.message}`) }

  console.warn('[AI fallback]', aiLog.join(' | '))
  return mockAiResponse()
}

function mockAiResponse() {
  const resp = [
    'В профиле можно поменять имя и аватар, перейти в Настройки → Профиль.',
    'Чтобы отправить голосовое сообщение, зажми иконку микрофона в чате.',
    'Подарки можно отправить из чата — нажми 🎁 в поле ввода.',
    'Тёмная тема включается в Настройках → Оформление.',
    'Для видеозвонков нажми 📹 в шапке чата.',
    'Группы создаются через кнопку в Контактах → Создать группу.',
    'Верификация аккаунта — в Настройках → Верификация.',
    'История сообщений хранится на сервере, доступна с любого устройства.',
    'Уведомления настраиваются в Настройках → Уведомления.',
    'Команда /help в чате покажет список доступных команд.',
  ]
  return resp[Math.floor(Math.random() * resp.length)]
}

app.get('/api/ai/models', (req, res) => {
  res.json({
    models: [
      { id: 'lite', name: 'Lite', description: 'Быстрая модель для ежедневных вопросов', premium: false },
      { id: 'pro', name: 'Pro', description: 'Улучшенная модель с глубокими ответами', premium: true },
    ],
  })
})

app.get('/api/ai/model', authMiddleware, async (req, res) => {
  const user = await dbGet('SELECT ai_model FROM users WHERE id = ?', req.user.id)
  res.json({ model: user?.ai_model || 'lite' })
})

app.post('/api/ai/model', authMiddleware, async (req, res) => {
  const { model } = req.body
  if (!['lite', 'pro'].includes(model)) return res.status(400).json({ error: 'Неверная модель' })
  const user = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  if (model === 'pro' && !isSubActive(user)) {
    return res.status(403).json({ error: 'Требуется подписка Premium' })
  }
  await dbRun('UPDATE users SET ai_model = ? WHERE id = ?', model, req.user.id)
  res.json({ model })
})

app.get('/api/premium/status', authMiddleware, async (req, res) => {
  const user = await dbGet('SELECT subscription_plan, subscription_until FROM users WHERE id = ?', req.user.id)
  const premium = isSubActive(user)
  res.json({
    premium,
    plan: user?.subscription_plan || null,
    until: user?.subscription_until || null,
  })
})

server.listen(PORT, HOST, () => {
  console.log(`MS Messenger server: http://${HOST}:${PORT}`)
  console.log(`WebSocket: ws://${HOST}:${PORT}/ws`)
  console.log(`AI: Lite=${AI_LITE_URL || 'mock'}, Pro=${AI_PRO_URL || 'mock'}`)
})
