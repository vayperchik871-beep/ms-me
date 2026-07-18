import { createClient } from '@libsql/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

let client

if (tursoUrl) {
  client = createClient({ url: tursoUrl, authToken: tursoToken || undefined })
  console.log('Using Turso database:', tursoUrl)
} else {
  const { DatabaseSync } = await import('node:sqlite')
  const dataDir = existsSync('/data') ? '/data' : join(__dirname, 'data')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const dbPath = join(dataDir, 'ms-messenger.db')
  const syncDb = new DatabaseSync(dbPath)
  syncDb.exec('PRAGMA journal_mode = WAL')
  syncDb.exec('PRAGMA foreign_keys = ON')

  client = {
    _sync: syncDb,
    async execute(input) {
      const sql = typeof input === 'string' ? input : input.sql
      const args = typeof input === 'string' ? [] : (input.args || [])
      const stmt = syncDb.prepare(sql)
      if (sql.trimStart().toUpperCase().startsWith('SELECT') || sql.trimStart().toUpperCase().startsWith('PRAGMA')) {
        const rows = stmt.all(...args)
        return { rows, rowsAffected: 0 }
      }
      if (sql.trimStart().toUpperCase().startsWith('INSERT')) {
        const info = stmt.run(...args)
        const rowId = syncDb.prepare('SELECT last_insert_rowid() as id').get()
        return { rows: [{ id: rowId?.id }], rowsAffected: info.changes }
      }
      const info = stmt.run(...args)
      return { rows: [], rowsAffected: info.changes }
    },
    async exec(sql) {
      syncDb.exec(sql)
    }
  }
  console.log('Using local SQLite database')
}

async function dbGet(sql, ...args) {
  const result = await client.execute({ sql, args })
  return result.rows[0] || null
}

async function dbAll(sql, ...args) {
  const result = await client.execute({ sql, args })
  return result.rows
}

async function dbRun(sql, ...args) {
  const result = await client.execute({ sql, args })
  return { changes: result.rowsAffected, lastInsertRowid: result.rows?.[0]?.id }
}

async function dbExec(sql) {
  await client.execute(sql)
}

await dbExec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    last_seen INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, device_id)
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    code TEXT NOT NULL,
    device_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS contacts (
    user_id TEXT NOT NULL REFERENCES users(id),
    contact_id TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, contact_id)
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct',
    created_at INTEGER NOT NULL
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id TEXT NOT NULL REFERENCES chats(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    last_read INTEGER DEFAULT NULL,
    PRIMARY KEY (chat_id, user_id)
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    content_enc TEXT NOT NULL,
    content_iv TEXT NOT NULL,
    content_tag TEXT NOT NULL,
    reply_to TEXT,
    pinned INTEGER DEFAULT 0,
    edited_at INTEGER,
    deleted INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS message_reactions (
    message_id TEXT NOT NULL REFERENCES messages(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id)
  )
`)

await dbExec(`
  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL REFERENCES users(id),
    message_id TEXT NOT NULL REFERENCES messages(id),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, message_id)
  )
`)

try { await dbExec('CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at)') } catch {}
try { await dbExec('CREATE INDEX IF NOT EXISTS idx_users_userid ON users(user_id)') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE messages ADD COLUMN attachment TEXT DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE chat_participants ADD COLUMN last_read INTEGER DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN scam INTEGER DEFAULT 0') } catch {}
try { await dbExec('ALTER TABLE sessions ADD COLUMN user_name TEXT DEFAULT NULL') } catch {}

try { await dbExec('ALTER TABLE users ADD COLUMN mcoins INTEGER DEFAULT 0') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN gender TEXT DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN profile_color TEXT DEFAULT NULL') } catch {}
try { await dbExec('ALTER TABLE users ADD COLUMN google_id TEXT DEFAULT NULL') } catch {}
try { await dbExec('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)') } catch {}

try { await dbExec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0') } catch {}
try { await dbExec("ALTER TABLE users ADD COLUMN verify_type TEXT DEFAULT 'msm'") } catch {}
try { await dbExec("ALTER TABLE verification_requests ADD COLUMN verify_type TEXT DEFAULT 'msm'") } catch {}

try {
  await dbExec(`CREATE TABLE IF NOT EXISTS verification_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    message TEXT,
    verify_type TEXT DEFAULT 'msm',
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    reviewed_by TEXT
  )`)
} catch {}

try { await dbExec('CREATE TABLE IF NOT EXISTS gifts (id TEXT PRIMARY KEY, emoji TEXT NOT NULL, title TEXT NOT NULL, price INTEGER DEFAULT 10)') } catch {}
try { await dbExec('CREATE TABLE IF NOT EXISTS user_gifts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), gift_id TEXT NOT NULL REFERENCES gifts(id), sender_id TEXT REFERENCES users(id), message TEXT, created_at INTEGER NOT NULL)') } catch {}

// Predefined gifts with prices
const GIFTS = [
  { id: 'rose', emoji: '🌹', title: 'Роза', price: 10 },
  { id: 'cake', emoji: '🎂', title: 'Торт', price: 20 },
  { id: 'chocolate', emoji: '🍫', title: 'Шоколад', price: 10 },
  { id: 'teddy', emoji: '🧸', title: 'Мишка', price: 25 },
  { id: 'bouquet', emoji: '💐', title: 'Букет', price: 30 },
  { id: 'giftbox', emoji: '🎁', title: 'Подарок', price: 15 },
  { id: 'ring', emoji: '💍', title: 'Кольцо', price: 50 },
  { id: 'balloons', emoji: '🎈', title: 'Шары', price: 10 },
  { id: 'champagne', emoji: '🍾', title: 'Шампанское', price: 35 },
  { id: 'candle', emoji: '🕯️', title: 'Свеча', price: 5 },
  { id: 'hibiscus', emoji: '🌺', title: 'Гибискус', price: 10 },
  { id: 'ribbon', emoji: '🎀', title: 'Лента', price: 5 },
]
for (const g of GIFTS) {
  try { await dbRun('INSERT OR REPLACE INTO gifts (id, emoji, title, price) VALUES (?, ?, ?, ?)', g.id, g.emoji, g.title, g.price) } catch {}
}

await dbExec('CREATE INDEX IF NOT EXISTS idx_user_gifts_user ON user_gifts(user_id)')

try {
  await dbRun(`UPDATE users SET avatar = REPLACE(avatar, 'http://0.0.0.0', 'https://ms-messenger-server.onrender.com') WHERE avatar LIKE 'http://0.0.0.0%'`)
  await dbRun(`UPDATE users SET avatar = REPLACE(avatar, 'http://localhost', 'https://ms-messenger-server.onrender.com') WHERE avatar LIKE 'http://localhost%'`)
  await dbRun(`UPDATE users SET avatar = REPLACE(avatar, 'http://', 'https://') WHERE avatar LIKE 'http://ms-messenger-server.onrender.com%'`)
  await dbRun(`UPDATE messages SET attachment = REPLACE(attachment, 'http://0.0.0.0', 'https://ms-messenger-server.onrender.com') WHERE attachment LIKE '%http://0.0.0.0%'`)
  await dbRun(`UPDATE messages SET attachment = REPLACE(attachment, 'http://localhost', 'https://ms-messenger-server.onrender.com') WHERE attachment LIKE '%http://localhost%'`)
  await dbRun(`UPDATE messages SET attachment = REPLACE(attachment, '"http://', '"https://') WHERE attachment LIKE '%"http://ms-messenger-server.onrender.com%'`)
} catch {}

const SYSTEM_BOT = {
  id: 'system-ms-messenger',
  user_id: 'ms-messenger',
  name: 'MS-Мессенджер',
  is_system: 1,
}

const existingBot = await dbGet('SELECT id FROM users WHERE user_id = ?', SYSTEM_BOT.user_id)
if (!existingBot) {
  await dbRun(
    'INSERT INTO users (id, user_id, name, password_hash, is_system, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    SYSTEM_BOT.id, SYSTEM_BOT.user_id, SYSTEM_BOT.name, '', 1, Date.now()
  )
}

export { dbGet, dbAll, dbRun, dbExec, SYSTEM_BOT }
