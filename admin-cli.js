import { createInterface } from 'readline'

const API = process.env.API_URL || 'https://ms-messenger-server.onrender.com'

let token = null

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function login(username, password) {
  const data = await api('POST', '/api/auth/login', { userId: username, password, deviceId: 'admin-cli' })
  if (data.needsVerification) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const code = await new Promise(r => rl.question('Код подтверждения (из чата с ботом): ', r))
    rl.close()
    const verified = await api('POST', '/api/auth/verify-device', { userId: username, code, deviceId: 'admin-cli' })
    token = verified.token
  } else {
    token = data.token
  }
}

async function run() {
  const username = process.argv[2] || 'admin'
  const password = process.argv[3]

  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const pw = await new Promise(r => rl.question('Пароль (будет виден при вводе): ', r))
    rl.close()
    process.argv[3] = pw
    return run()
  }

  try {
    console.log(`Connecting to ${API}...`)
    await login(username, password)
    console.log(`Logged in as @${username}\n`)
  } catch (e) {
    console.error('Login failed:', e.message)
    process.exit(1)
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: 'msm> ' })
  rl.prompt()

  rl.on('line', async (line) => {
    const cmd = line.trim()
    if (!cmd) { rl.prompt(); return }
    if (cmd === 'exit' || cmd === 'quit') { rl.close(); return }
    if (cmd === 'clear') { console.clear(); rl.prompt(); return }
    try {
      const res = await api('POST', '/api/admin/command', { command: cmd })
      console.log(res.output)
    } catch (e) {
      console.error(`Error: ${e.message}`)
    }
    rl.prompt()
  })

  rl.on('close', () => { console.log('\nBye.'); process.exit(0) })
}

run()
