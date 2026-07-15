import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(join(__dirname, 'ms-messenger.db'))

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    last_seen INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, device_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    code TEXT NOT NULL,
    device_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contacts (
    user_id TEXT NOT NULL REFERENCES users(id),
    contact_id TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, contact_id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id TEXT NOT NULL REFERENCES chats(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    PRIMARY KEY (chat_id, user_id)
  );

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
  );

  CREATE TABLE IF NOT EXISTS message_reactions (
    message_id TEXT NOT NULL REFERENCES messages(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL REFERENCES users(id),
    message_id TEXT NOT NULL REFERENCES messages(id),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, message_id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_users_userid ON users(user_id);
`)

try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL") } catch {}
try { db.exec("ALTER TABLE messages ADD COLUMN attachment TEXT DEFAULT NULL") } catch {}

const SYSTEM_BOT = {
  id: 'system-ms-messenger',
  user_id: 'ms-messenger',
  name: 'MS-Мессенджер',
  is_system: 1,
}

const existingBot = db.prepare('SELECT id FROM users WHERE user_id = ?').get(SYSTEM_BOT.user_id)
if (!existingBot) {
  db.prepare(
    'INSERT INTO users (id, user_id, name, password_hash, is_system, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(SYSTEM_BOT.id, SYSTEM_BOT.user_id, SYSTEM_BOT.name, '', 1, Date.now())
}

export { db, SYSTEM_BOT }
