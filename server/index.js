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
import { db, SYSTEM_BOT } from './db.js'
import multer from 'multer'
import { encrypt, decrypt, generateCode, hashDevice } from './crypto.js'

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

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(header.slice(7))
    if (!session || session.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Сессия истекла' })
    }
    const row = db.prepare('SELECT id, user_id, name, is_system FROM users WHERE id = ?').get(payload.userId)
    if (!row) return res.status(401).json({ error: 'Пользователь не найден' })
    const adminRow = db.prepare('SELECT is_admin, banned FROM users WHERE id = ?').get(payload.userId)
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

function createToken(userId, deviceId) {
  const token = jwt.sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '30d' })
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  db.prepare('INSERT OR REPLACE INTO sessions (token, user_id, device_id, expires_at) VALUES (?, ?, ?, ?)').run(
    token, userId, deviceId, expiresAt
  )
  return token
}

function getOrCreateDirectChat(userA, userB) {
  const rows = db.prepare(`
    SELECT c.id FROM chats c
    JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = ?
    JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = ?
    WHERE c.type = 'direct'
  `).all(userA, userB)
  if (rows.length > 0) return rows[0].id

  const chatId = uuidv4()
  const now = Date.now()
  db.prepare('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)').run(chatId, 'direct', now)
  db.prepare('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)').run(chatId, userA)
  db.prepare('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)').run(chatId, userB)
  return chatId
}

function sendBotMessage(userId, text) {
  const chatId = getOrCreateDirectChat(userId, SYSTEM_BOT.id)
  const msgId = uuidv4()
  const enc = encrypt(text)
  const now = Date.now()
  db.prepare(`
    INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, chatId, SYSTEM_BOT.id, enc.content_enc, enc.content_iv, enc.content_tag, now)

  broadcastToUser(userId, { type: 'new_message', chatId, message: formatMessage(msgId, userId) })
  return { chatId, messageId: msgId }
}

function formatMessage(msgId, viewerId) {
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId)
  if (!m || m.deleted) return null
  const sender = db.prepare('SELECT id, user_id, name, is_system, avatar FROM users WHERE id = ?').get(m.sender_id)
  const reactions = db.prepare('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?').all(m.id)
  let attachment = null
  if (m.attachment) {
    try { attachment = JSON.parse(m.attachment) } catch {}
  }
  let read = false
  if (viewerId) {
    const participants = db.prepare('SELECT user_id, last_read FROM chat_participants WHERE chat_id = ? AND user_id != ?').all(m.chat_id, viewerId)
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

function broadcastToChat(chatId, data, excludeUserId) {
  const participants = db.prepare('SELECT user_id FROM chat_participants WHERE chat_id = ?').all(chatId)
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

  const existing = db.prepare('SELECT id FROM users WHERE user_id = ?').get(cleanId)
  if (existing) return res.status(409).json({ error: 'Этот ID уже занят' })

  const isFirst = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_system = 0').get().c === 0
  const id = uuidv4()
  const hash = await bcrypt.hash(password, 12)
  const now = Date.now()

  db.prepare('INSERT INTO users (id, user_id, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, cleanId, name.trim(), hash, isFirst ? 1 : 0, now
  )

  const devId = hashDevice(deviceId)
  db.prepare('INSERT INTO devices (id, user_id, device_id, verified, last_seen, created_at) VALUES (?, ?, ?, 1, ?, ?)').run(
    uuidv4(), id, devId, now, now
  )

  const token = createToken(id, devId)
  getOrCreateDirectChat(id, SYSTEM_BOT.id)
  sendBotMessage(id, `Добро пожаловать в MS Messenger, ${name.trim()}!\n\nВаш ID: @${cleanId}\n\nДругие пользователи могут найти вас по этому ID. Этот чат используется для кодов подтверждения при входе с нового устройства.`)

  res.json({
    token,
    user: { id, userId: cleanId, name: name.trim() },
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { userId, password, deviceId } = req.body
  if (!userId || !password || !deviceId) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  const cleanId = sanitizeUserId(userId)
  const user = db.prepare('SELECT * FROM users WHERE user_id = ? AND is_system = 0').get(cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  if (user.banned) return res.status(403).json({ error: 'Аккаунт заблокирован' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Неверный пароль' })

  const devId = hashDevice(deviceId)
  const device = db.prepare('SELECT * FROM devices WHERE user_id = ? AND device_id = ?').get(user.id, devId)

  if (device?.verified) {
    db.prepare('UPDATE devices SET last_seen = ? WHERE id = ?').run(Date.now(), device.id)
    const token = createToken(user.id, devId)
    return res.json({
      token,
      user: { id: user.id, userId: user.user_id, name: user.name },
      needsVerification: false,
    })
  }

  const code = generateCode()
  const codeId = uuidv4()
  const expires = Date.now() + 10 * 60 * 1000

  db.prepare(`
    INSERT INTO verification_codes (id, user_id, code, device_id, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(codeId, user.id, code, devId, expires)

  if (!device) {
    db.prepare('INSERT INTO devices (id, user_id, device_id, verified, created_at) VALUES (?, ?, ?, 0, ?)').run(
      uuidv4(), user.id, devId, Date.now()
    )
  }

  sendBotMessage(user.id, `🔐 Код подтверждения для нового устройства:\n\n${code}\n\nКод действителен 10 минут. Никому не сообщайте его.`)

  res.json({
    needsVerification: true,
    userId: user.user_id,
    message: 'Код отправлен в чат MS-Мессенджер',
  })
})

app.post('/api/auth/verify-device', (req, res) => {
  const { userId, code, deviceId } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

  const devId = hashDevice(deviceId)
  const record = db.prepare(`
    SELECT * FROM verification_codes
    WHERE user_id = ? AND code = ? AND device_id = ? AND used = 0 AND expires_at > ?
    ORDER BY expires_at DESC LIMIT 1
  `).get(user.id, code, devId, Date.now())

  if (!record) return res.status(400).json({ error: 'Неверный или просроченный код' })

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id)
  db.prepare('UPDATE devices SET verified = 1, last_seen = ? WHERE user_id = ? AND device_id = ?').run(
    Date.now(), user.id, devId
  )

  const token = createToken(user.id, devId)
  res.json({
    token,
    user: { id: user.id, userId: user.user_id, name: user.name },
  })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = db.prepare('SELECT id, user_id, name, is_system, avatar FROM users WHERE id = ?').get(req.user.id)
  const extra = db.prepare('SELECT is_admin, banned FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: { ...u, ...extra } })
})

// ─── Admin ───

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Только для администраторов' })
  }
  next()
}

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_system = 0').get()
  const onlineUsers = Array.from(clients.values()).filter((c) => c.readyState === 1).length
  const bannedUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE banned = 1').get()
  const scamUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE scam = 1').get()
  const totalChats = db.prepare('SELECT COUNT(*) as c FROM chats').get()
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages WHERE deleted = 0').get()
  res.json({
    totalUsers: totalUsers.c,
    onlineUsers,
    bannedUsers: bannedUsers.c,
    scamUsers: scamUsers.c,
    totalChats: totalChats.c,
    totalMessages: totalMessages.c,
  })
})

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, user_id, name, is_admin, banned, scam, created_at FROM users WHERE is_system = 0 ORDER BY created_at DESC LIMIT 100
  `).all()
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

app.post('/api/admin/ban', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, value } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = db.prepare('SELECT id FROM users WHERE user_id = ?').get(cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(value ? 1 : 0, user.id)
  res.json({ ok: true, userId: cleanId, banned: !!value })
})

app.post('/api/admin/scam', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, value } = req.body
  const cleanId = sanitizeUserId(userId)
  const user = db.prepare('SELECT id, name FROM users WHERE user_id = ?').get(cleanId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  const oldName = user.name
  const newName = value ? `[SCAM] ${oldName.replace(/^\[SCAM\]\s*/i, '')}` : oldName.replace(/^\[SCAM\]\s*/i, '')
  db.prepare('UPDATE users SET scam = ?, name = ? WHERE id = ?').run(value ? 1 : 0, newName, user.id)
  res.json({ ok: true, userId: cleanId, scam: !!value, name: newName })
})

app.post('/api/admin/command', authMiddleware, adminMiddleware, (req, res) => {
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
        const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_system = 0').get()
        const online = Array.from(clients.values()).filter((c) => c.readyState === 1).length
        const banned = db.prepare('SELECT COUNT(*) as c FROM users WHERE banned = 1').get()
        const scam = db.prepare('SELECT COUNT(*) as c FROM users WHERE scam = 1').get()
        const chats = db.prepare('SELECT COUNT(*) as c FROM chats').get()
        const msgs = db.prepare('SELECT COUNT(*) as c FROM messages WHERE deleted = 0').get()
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
        const users = db.prepare('SELECT user_id, name, is_admin, banned, scam FROM users WHERE is_system = 0 ORDER BY created_at DESC LIMIT 100').all()
        const lines = users.map((u) =>
          `@${u.user_id} "${u.name}"${u.is_admin ? ' [ADMIN]' : ''}${u.banned ? ' [BANNED]' : ''}${u.scam ? ' [SCAM]' : ''}`
        )
        return res.json(say(lines.length ? lines.join('\n') : 'Нет пользователей'))
      }
      case 'ban': {
        if (!args[0]) return res.json(say('Укажите userId: ban <id>'))
        const user = db.prepare('SELECT id FROM users WHERE user_id = ?').get(args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(user.id)
        return res.json(say(`@${args[0]} забанен`))
      }
      case 'unban': {
        if (!args[0]) return res.json(say('Укажите userId: unban <id>'))
        const user = db.prepare('SELECT id FROM users WHERE user_id = ?').get(args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        db.prepare('UPDATE users SET banned = 0 WHERE id = ?').run(user.id)
        return res.json(say(`@${args[0]} разбанен`))
      }
      case 'scam': {
        if (!args[0]) return res.json(say('Укажите userId: scam <id>'))
        const user = db.prepare('SELECT id, name FROM users WHERE user_id = ?').get(args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const newName = `[SCAM] ${user.name.replace(/^\[SCAM\]\s*/i, '')}`
        db.prepare('UPDATE users SET scam = 1, name = ? WHERE id = ?').run(newName, user.id)
        return res.json(say(`@${args[0]} помечен как скам (имя: ${newName})`))
      }
      case 'unscam': {
        if (!args[0]) return res.json(say('Укажите userId: unscam <id>'))
        const user = db.prepare('SELECT id, name FROM users WHERE user_id = ?').get(args[0])
        if (!user) return res.json(say('Пользователь не найден'))
        const newName = user.name.replace(/^\[SCAM\]\s*/i, '')
        db.prepare('UPDATE users SET scam = 0, name = ? WHERE id = ?').run(newName, user.id)
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
        const botId = SYSTEM_BOT?.id || db.prepare("SELECT id FROM users WHERE is_system = 1 LIMIT 1").get()?.id
        if (!botId) return res.json(say('Системный бот не найден'))
        const chatsList = db.prepare('SELECT id FROM chats').all()
        for (const chat of chatsList) {
          db.prepare('INSERT INTO messages (chat_id, sender_id, text, created_at, deleted) VALUES (?, ?, ?, ?, 0)').run(chat.id, botId, text, Date.now())
        }
        return res.json(say(`Сообщение отправлено в ${chatsList.length} чатов`))
      }
      case 'say': {
        const targetId = args[0]
        const text = args.slice(1).join(' ')
        if (!targetId || !text) return res.json(say('Укажите: say <userId> <сообщение>'))
        const target = db.prepare('SELECT id FROM users WHERE user_id = ?').get(targetId)
        if (!target) return res.json(say('Пользователь не найден'))
        const botId = SYSTEM_BOT?.id || db.prepare("SELECT id FROM users WHERE is_system = 1 LIMIT 1").get()?.id
        if (!botId) return res.json(say('Системный бот не найден'))
        let chat = db.prepare(`
          SELECT c.id FROM chats c
          INNER JOIN chat_members cm ON cm.chat_id = c.id
          WHERE c.type = 'private' AND cm.user_id = ? AND c.id IN (SELECT chat_id FROM chat_members WHERE user_id = ?)
        `).get(target.id, botId)
        if (!chat) {
          const chatId = uuidv4()
          db.prepare('INSERT INTO chats (id, type, created_at) VALUES (?, ?, ?)').run(chatId, 'private', Date.now())
          db.prepare('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)').run(chatId, target.id)
          db.prepare('INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)').run(chatId, botId)
          chat = { id: chatId }
        }
        db.prepare('INSERT INTO messages (chat_id, sender_id, text, created_at, deleted) VALUES (?, ?, ?, ?, 0)').run(chat.id, botId, text, Date.now())
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

app.get('/api/users/search', authMiddleware, (req, res) => {
  const q = sanitizeUserId(req.query.q || '')
  if (q.length < 2) return res.json({ users: [] })

  const users = db.prepare(`
    SELECT id, user_id, name, avatar FROM users
    WHERE user_id LIKE ? AND is_system = 0 AND id != ?
    LIMIT 20
  `).all(`${q}%`, req.user.id)

  res.json({ users: users.map((u) => ({ id: u.id, userId: u.user_id, name: u.name, avatar: u.avatar })) })
})

app.get('/api/users/:userId', authMiddleware, (req, res) => {
  const cleanId = sanitizeUserId(req.params.userId)
  const user = db.prepare('SELECT id, user_id, name, is_system, avatar FROM users WHERE user_id = ?').get(cleanId)
  if (!user) return res.status(404).json({ error: 'Не найден' })
  res.json({
    user: { id: user.id, userId: user.user_id, name: user.name, isSystem: !!user.is_system, avatar: user.avatar },
  })
})

// ─── Contacts ───

app.get('/api/contacts', authMiddleware, (req, res) => {
  const contacts = db.prepare(`
    SELECT u.id, u.user_id, u.name, u.is_system, u.avatar, c.created_at
    FROM contacts c
    JOIN users u ON u.id = c.contact_id
    WHERE c.user_id = ?
    ORDER BY u.name
  `).all(req.user.id)

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

app.post('/api/contacts', authMiddleware, (req, res) => {
  const { userId } = req.body
  const cleanId = sanitizeUserId(userId)
  const contact = db.prepare('SELECT id, user_id, name, is_system, avatar FROM users WHERE user_id = ?').get(cleanId)
  if (!contact) return res.status(404).json({ error: 'Пользователь не найден' })
  if (contact.id === req.user.id) return res.status(400).json({ error: 'Нельзя добавить себя' })
  if (contact.is_system) return res.status(400).json({ error: 'Нельзя добавить системный аккаунт' })

  db.prepare('INSERT OR IGNORE INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)').run(
    req.user.id, contact.id, Date.now()
  )
  db.prepare('INSERT OR IGNORE INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)').run(
    contact.id, req.user.id, Date.now()
  )

  const chatId = getOrCreateDirectChat(req.user.id, contact.id)
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

app.post('/api/upload/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.user.id)
  res.json({ avatar: url })
})

app.post('/api/upload/attachment', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const url = fullUrl(req, `/uploads/${req.file.filename}`)
  const type = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('audio/') ? 'voice' : 'file'
  const duration = req.body.duration ? parseInt(req.body.duration, 10) : null
  res.json({ url, type, name: req.file.originalname, size: req.file.size, duration })
})

app.patch('/api/users/avatar', authMiddleware, (req, res) => {
  const { avatar } = req.body
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar || null, req.user.id)
  res.json({ avatar })
})

// ─── Chats ───

app.get('/api/chats', authMiddleware, (req, res) => {
  const chats = db.prepare(`
    SELECT c.id, c.type,
      (SELECT content_enc FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_enc,
      (SELECT content_iv FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_iv,
      (SELECT content_tag FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_tag,
      (SELECT created_at FROM messages m WHERE m.chat_id = c.id AND m.deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_time
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = ?
    ORDER BY last_time DESC NULLS LAST
  `).all(req.user.id)

  const result = chats.map((chat) => {
    const others = db.prepare(`
      SELECT u.id, u.user_id, u.name, u.is_system, u.avatar FROM users u
      JOIN chat_participants cp ON cp.user_id = u.id
      WHERE cp.chat_id = ? AND u.id != ?
    `).all(chat.id, req.user.id)

    const peer = others[0]
    let lastMessage = ''
    if (chat.last_enc) {
      try { lastMessage = decrypt(chat.last_enc, chat.last_iv, chat.last_tag) } catch { lastMessage = '🔒' }
    }

    const unread = db.prepare(`
      SELECT COUNT(*) as c FROM messages
      WHERE chat_id = ? AND sender_id != ? AND created_at > COALESCE(
        (SELECT last_read FROM chat_participants WHERE chat_id = ? AND user_id = ?), 0
      )
    `).get(chat.id, req.user.id, chat.id, req.user.id)

    return {
      id: chat.id,
      peer: peer ? { id: peer.id, userId: peer.user_id, name: peer.name, isSystem: !!peer.is_system, avatar: peer.avatar, online: isUserOnline(peer.id) } : null,
      lastMessage,
      lastTime: chat.last_time ? formatTime(chat.last_time) : '',
      unread: unread?.c || 0,
    }
  })

  res.json({ chats: result })
})

// ─── Messages ───

app.get('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  const participant = db.prepare(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?'
  ).get(req.params.chatId, req.user.id)
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const rows = db.prepare(`
    SELECT id FROM messages WHERE chat_id = ? AND deleted = 0 ORDER BY created_at ASC
  `).all(req.params.chatId)

  res.json({ messages: rows.map((r) => formatMessage(r.id, req.user.id)).filter(Boolean) })
})

app.post('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  const { text, replyTo, attachment: attach } = req.body
  if (!text?.trim() && !attach) return res.status(400).json({ error: 'Пустое сообщение' })

  const participant = db.prepare(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?'
  ).get(req.params.chatId, req.user.id)
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const msgId = uuidv4()
  const content = text?.trim() || '📎'
  const enc = encrypt(content)
  const now = Date.now()
  const attachment = attach ? JSON.stringify(attach) : null

  db.prepare(`
    INSERT INTO messages (id, chat_id, sender_id, content_enc, content_iv, content_tag, reply_to, attachment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, req.params.chatId, req.user.id, enc.content_enc, enc.content_iv, enc.content_tag, replyTo || null, attachment, now)

  const message = formatMessage(msgId, req.user.id)
  broadcastToChat(req.params.chatId, { type: 'new_message', chatId: req.params.chatId, message }, req.user.id)
  res.json({ message })
})

app.patch('/api/messages/:id', authMiddleware, (req, res) => {
  const { text } = req.body
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!msg || msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Нельзя редактировать' })

  const enc = encrypt(text.trim())
  db.prepare(`
    UPDATE messages SET content_enc = ?, content_iv = ?, content_tag = ?, edited_at = ? WHERE id = ?
  `).run(enc.content_enc, enc.content_iv, enc.content_tag, Date.now(), req.params.id)

  const message = formatMessage(req.params.id, req.user.id)
  broadcastToChat(msg.chat_id, { type: 'message_updated', message })
  res.json({ message })
})

app.delete('/api/messages/:id', authMiddleware, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!msg || msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Нельзя удалить' })

  db.prepare('UPDATE messages SET deleted = 1 WHERE id = ?').run(req.params.id)
  broadcastToChat(msg.chat_id, { type: 'message_deleted', messageId: req.params.id, chatId: msg.chat_id })
  res.json({ ok: true })
})

app.post('/api/messages/:id/pin', authMiddleware, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!msg) return res.status(404).json({ error: 'Не найдено' })

  db.prepare('UPDATE messages SET pinned = ? WHERE id = ?').run(msg.pinned ? 0 : 1, req.params.id)
  res.json({ pinned: !msg.pinned })
})

app.post('/api/messages/:id/react', authMiddleware, (req, res) => {
  const { emoji } = req.body
  const msg = db.prepare('SELECT id FROM messages WHERE id = ?').get(req.params.id)
  if (!msg) return res.status(404).json({ error: 'Не найдено' })

  const existing = db.prepare('SELECT emoji FROM message_reactions WHERE message_id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (existing?.emoji === emoji) {
    db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?').run(req.params.id, req.user.id)
  } else {
    db.prepare('INSERT OR REPLACE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)').run(
      req.params.id, req.user.id, emoji
    )
  }

  const reactions = db.prepare('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?').all(req.params.id)
  res.json({ reactions })
})

app.post('/api/chats/:chatId/read', authMiddleware, (req, res) => {
  const participant = db.prepare(
    'SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?'
  ).get(req.params.chatId, req.user.id)
  if (!participant) return res.status(403).json({ error: 'Нет доступа' })

  const now = Date.now()
  db.prepare('UPDATE chat_participants SET last_read = ? WHERE chat_id = ? AND user_id = ?').run(
    now, req.params.chatId, req.user.id
  )

  broadcastToChat(req.params.chatId, {
    type: 'read_receipt',
    chatId: req.params.chatId,
    userId: req.user.id,
    lastRead: now,
  }, req.user.id)

  res.json({ ok: true })
})

app.post('/api/messages/:id/favorite', authMiddleware, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, message_id, created_at) VALUES (?, ?, ?)').run(
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

// ─── WebSocket ───

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  if (!token) { ws.close(); return }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token)
    if (!session || session.expires_at < Date.now()) { ws.close(); return }

    ws.userId = payload.userId
    ws.token = token
    clients.set(token, ws)

    const contacts = db.prepare(`
      SELECT DISTINCT cp2.user_id FROM chat_participants cp1
      JOIN chat_participants cp2 ON cp2.chat_id = cp1.chat_id
      WHERE cp1.user_id = ? AND cp2.user_id != ?
    `).all(payload.userId, payload.userId)
    for (const c of contacts) {
      broadcastToUser(c.user_id, { type: 'user_online', userId: payload.userId })
    }

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString())
        if (data.type === 'typing') {
          const participants = db.prepare('SELECT user_id FROM chat_participants WHERE chat_id = ?').all(data.chatId)
          for (const p of participants) {
            if (p.user_id !== payload.userId) {
              broadcastToUser(p.user_id, { type: 'typing', chatId: data.chatId, userId: payload.userId, isTyping: data.isTyping })
            }
          }
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
  } catch {
    ws.close()
  }
})

server.listen(PORT, HOST, () => {
  console.log(`MS Messenger server: http://${HOST}:${PORT}`)
  console.log(`WebSocket: ws://${HOST}:${PORT}/ws`)
})
