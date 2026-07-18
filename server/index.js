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
import { dbGet, dbAll, dbRun, dbExec, SYSTEM_BOT } from './db.js'
import multer from 'multer'
import { encrypt, decrypt, generateCode, hashDevice } from './crypto.js'
import { OAuth2Client } from 'google-auth-library'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(rootDir, 'uploads')
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
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|ogg|wav|mp3|webm|mov|heic)$/i
    if (allowed.test(path.extname(file.originalname))) return cb(null, true)
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

app.use(cors())
app.use(express.json())
app.use(express.static(frontendDistDir))
app.use('/uploads', express.static(path.join(rootDir, 'uploads')))

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

async function sendBotMessage(userId, text) {
  const chatId = await getOrCreateDirectChat(userId, SYSTEM_BOT.id)
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
  return {
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    senderUserId: sender?.user_id,
    senderName: sender?.name,
    text: decrypt(m.content_enc, m.content_iv, m.content_tag),
    replyTo: m.reply_to,
    pinned: !!m.pinned,
    edited: !!m.edited_at,
    time: formatTime(m.created_at),
    createdAt: m.created_at,
    reactions,
    attachment,
    read,
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

// ─── Auth ───

app.post('/api/auth/register', async (req, res) => {
  const { name, userId, password, deviceId } = req.body
  const isAdminApp = req.headers['x-admin-app'] === 'true'
  if (!name?.trim() || !userId?.trim() || !password || !deviceId) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' })
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
  const hash = await bcrypt.hash(password, 12)
  const now = Date.now()

  await dbRun('INSERT INTO users (id, user_id, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, cleanId, name.trim(), hash, isFirst || isAdminApp ? 1 : 0, now
  )

  const devId = hashDevice(deviceId)
  await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
    uuidv4(), id, devId, now, now
  )

  const token = await createToken(id, devId)
  await getOrCreateDirectChat(id, SYSTEM_BOT.id)
  await sendBotMessage(id, `Добро пожаловать в MS Messenger, ${name.trim()}!\n\nВаш ID: @${cleanId}\n\nДругие пользователи могут найти вас по этому ID. Этот чат используется для кодов подтверждения при входе с нового устройства.`)

  res.json({
    token,
    user: { id, userId: cleanId, name: name.trim() },
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { userId, password, deviceId } = req.body
  const isAdminApp = req.headers['x-admin-app'] === 'true'
  if (!userId || !password || !deviceId) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  const cleanId = sanitizeUserId(userId)
  const user = await dbGet('SELECT * FROM users WHERE user_id = ? AND is_system = 0', cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  if (user.banned) return res.status(403).json({ error: 'Аккаунт заблокирован' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Неверный пароль' })

  const devId = hashDevice(deviceId)
  const device = await dbGet('SELECT * FROM devices WHERE user_id = ? AND device_id = ?', user.id, devId)

  if (device?.verified || isAdminApp) {
    if (!device) {
      await dbRun('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)',
        uuidv4(), user.id, devId, Date.now(), Date.now()
      )
    } else if (!device.verified) {
      await dbRun('UPDATE devices SET verified = 1, last_seen = ? WHERE id = ?', Date.now(), device.id)
    } else {
      await dbRun('UPDATE devices SET last_seen = ? WHERE id = ?', Date.now(), device.id)
    }
    if (isAdminApp) {
      await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', user.id)
    }
    const token = await createToken(user.id, devId)
    return res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name },
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
    user: { id: user.id, userId: user.user_id, name: user.name },
  })
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const u = await dbGet('SELECT id, user_id, name, is_system, avatar, birthday, gender, profile_color, mcoins FROM users WHERE id = ?', req.user.id)
  const extra = await dbGet('SELECT is_admin, banned FROM users WHERE id = ?', req.user.id)
  res.json({ user: {
    id: u.id,
    userId: u.user_id,
    name: u.name,
    isSystem: !!u.is_system,
    avatar: u.avatar,
    birthday: u.birthday,
    gender: u.gender,
    profileColor: u.profile_color,
    mcoins: u.mcoins || 0,
    isAdmin: !!extra?.is_admin,
    banned: !!extra?.banned,
  } })
})

// ─── Google Auth ───

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
        'INSERT INTO users (id, user_id, name, password_hash, google_id, avatar, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        id, tempId, googleName, fakeHash, googleId, avatarUrl, isFirst || isAdminApp ? 1 : 0, now
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
    if (isAdminApp) {
      await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', user.id)
    }

    if (avatarUrl && avatarUrl !== user.avatar) {
      await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, user.id)
    }

    const token = await createToken(user.id, devId)
    res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name },
    })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Ошибка верификации Google' })
  }
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
  res.json({
    totalUsers: totalUsers.c,
    onlineUsers,
    bannedUsers: bannedUsers.c,
    scamUsers: scamUsers.c,
    totalChats: totalChats.c,
    totalMessages: totalMessages.c,
  })
})

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await dbAll(`
    SELECT id, user_id, name, is_admin, banned, scam, created_at FROM users WHERE is_system = 0 ORDER BY created_at DESC LIMIT 100
  `)
  res.json({ users: users.map((u) => ({
    id: u.id,
    userId: u.user_id,
    name: u.name,
    isAdmin: !!u.is_admin,
    banned: !!u.banned,
    scam: !!u.scam,
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
          '  online         — список онлайн пользователей',
          '  bc <text>      — отправить сообщение всем чатам (broadcast)',
          '  say <id> <msg> — написать от имени бота в личный чат с пользователем',
          '  clear          — очистить терминал',
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
      default:
        return res.json(say(`Неизвестная команда: ${cmd}. Введите help для списка команд`))
    }
  } catch (err) {
    return res.json(say(`Ошибка: ${err.message}`))
  }
})

// ─── Users ───

app.get('/api/users/search', authMiddleware, async (req, res) => {
  const q = sanitizeUserId(req.query.q || '')
  if (q.length < 2) return res.json({ users: [] })

  const users = await dbAll(`
    SELECT id, user_id, name, avatar FROM users
    WHERE user_id LIKE ? AND is_system = 0 AND id != ?
    LIMIT 20
  `, `${q}%`, req.user.id)

  res.json({ users: users.map((u) => ({ id: u.id, userId: u.user_id, name: u.name, avatar: u.avatar })) })
})

app.get('/api/users/:userId', authMiddleware, async (req, res) => {
  const cleanId = sanitizeUserId(req.params.userId)
  const user = await dbGet('SELECT id, user_id, name, is_system, avatar, birthday, gender, profile_color FROM users WHERE user_id = ?', cleanId)
  if (!user) return res.status(404).json({ error: 'Не найден' })
  const mutual = await dbAll(`
    SELECT cp.chat_id FROM chat_participants cp
    WHERE cp.user_id = ? AND cp.chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = ?
    )
  `, user.id, req.user.id)
  res.json({
    user: { id: user.id, userId: user.user_id, name: user.name, isSystem: !!user.is_system, avatar: user.avatar, birthday: user.birthday, gender: user.gender, profileColor: user.profile_color },
    mutualChats: mutual.map(r => r.chat_id),
  })
})

app.patch('/api/user/profile', authMiddleware, async (req, res) => {
  const { birthday, gender, profileColor, name, userId, avatar } = req.body
  if (birthday !== undefined) await dbRun('UPDATE users SET birthday = ? WHERE id = ?', birthday || null, req.user.id)
  if (gender !== undefined) await dbRun('UPDATE users SET gender = ? WHERE id = ?', gender || null, req.user.id)
  if (profileColor !== undefined) await dbRun('UPDATE users SET profile_color = ? WHERE id = ?', profileColor || null, req.user.id)
  if (name !== undefined) await dbRun('UPDATE users SET name = ? WHERE id = ?', name.trim(), req.user.id)
  if (avatar !== undefined) await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatar || null, req.user.id)
  if (userId !== undefined) {
    const cleanId = sanitizeUserId(userId)
    const existing = await dbGet('SELECT id FROM users WHERE user_id = ? AND id != ?', cleanId, req.user.id)
    if (existing) return res.status(409).json({ error: 'Этот ID уже занят' })
    if (cleanId.length < 3) return res.status(400).json({ error: 'ID должен быть минимум 3 символа' })
    await dbRun('UPDATE users SET user_id = ? WHERE id = ?', cleanId, req.user.id)
  }
  const u = await dbGet('SELECT id, user_id, name, avatar, birthday, gender, profile_color FROM users WHERE id = ?', req.user.id)
  res.json({ user: { ...u } })
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
      avatar: c.avatar,
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
    contact: { id: contact.id, userId: contact.user_id, name: contact.name, isSystem: !!contact.is_system, avatar: contact.avatar },
    chatId,
  })
})

// ─── Uploads ───

function fullUrl(req, path) {
  if (PUBLIC_URL) return `${PUBLIC_URL.replace(/\/$/, '')}${path}`
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = (req.headers['x-forwarded-host'] || req.get('host') || req.headers.host || '').replace(/:.*$/, '')
  if (host && !host.includes('0.0.0.0') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}${path}`
  }
  return `${path}`
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
  const type = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('audio/') ? 'voice' : 'file'
  const duration = req.body.duration ? parseInt(req.body.duration, 10) : null
  res.json({ url, type, name: req.file.originalname, size: req.file.size, duration })
})

app.patch('/api/users/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body
  await dbRun('UPDATE users SET avatar = ? WHERE id = ?', avatar || null, req.user.id)
  res.json({ avatar })
})

// ─── Chats ───

app.get('/api/chats', authMiddleware, async (req, res) => {
  const chats = await dbAll(`
    SELECT c.id, c.type,
      (SELECT content_enc FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_enc,
      (SELECT content_iv FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_iv,
      (SELECT content_tag FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_tag,
      (SELECT created_at FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_time
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ?
    ORDER BY last_time DESC NULLS LAST
  `, req.user.id)

  const result = await Promise.all(chats.map(async (chat) => {
const others = await dbAll(`
      SELECT u.id, u.user_id, u.name, u.is_system, u.avatar, u.profile_color FROM users u
      JOIN chat_participants cp ON cp.user_id = u.id
      WHERE cp.chat_id = ? AND u.id != ?
      `, chat.id, req.user.id)

    const peer = others[0]
    let lastMessage = ''
    if (chat.last_enc) {
      try { lastMessage = decrypt(chat.last_enc, chat.last_iv, chat.last_tag) } catch { lastMessage = '🔒' }
    }

    const unread = await dbGet(`
      SELECT COUNT(*) as c FROM messages
      WHERE chat_id = ? AND sender_id != ? AND created_at > COALESCE(
        (SELECT last_read FROM chat_participants WHERE chat_id = ? AND user_id = ?), 0
      )
    `, chat.id, req.user.id, chat.id, req.user.id)

    let lastSeen = null
    if (peer && !isUserOnline(peer.id)) {
      const device = await dbGet('SELECT last_seen FROM devices WHERE user_id = ? ORDER BY last_seen DESC LIMIT 1', peer.id)
      lastSeen = device?.last_seen || null
    }

    return {
      id: chat.id,
      peer: peer ? { id: peer.id, userId: peer.user_id, name: peer.name, isSystem: !!peer.is_system, avatar: peer.avatar, profileColor: peer.profile_color, online: isUserOnline(peer.id), lastSeen } : null,
      lastMessage,
      lastTime: chat.last_time ? formatTime(chat.last_time) : '',
      unread: unread?.c || 0,
    }
  }))

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
    SELECT id FROM messages WHERE chat_id = ? AND deleted = 0 ORDER BY created_at ASC
  `, req.params.chatId)

  const messages = []
  for (const r of rows) {
    const msg = await formatMessage(r.id, req.user.id)
    if (msg) messages.push(msg)
  }
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
  res.json({ message })
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

// ─── WebSocket ───

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
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

server.listen(PORT, HOST, () => {
  console.log(`MS Messenger server: http://${HOST}:${PORT}`)
  console.log(`WebSocket: ws://${HOST}:${PORT}/ws`)
})
