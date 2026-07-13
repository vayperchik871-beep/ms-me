import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const DEV_KEY = crypto.createHash('sha256').update('ms-messenger-dev-encryption-key').digest('hex')

function getKey() {
  const hex = process.env.MS_ENCRYPTION_KEY || DEV_KEY
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(DEV_KEY, 'hex')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    content_enc: encrypted.toString('base64'),
    content_iv: iv.toString('base64'),
    content_tag: tag.toString('base64'),
  }
}

export function decrypt(content_enc, content_iv, content_tag) {
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(content_iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(content_tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content_enc, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function hashDevice(deviceId) {
  return crypto.createHash('sha256').update(deviceId).digest('hex').slice(0, 32)
}
