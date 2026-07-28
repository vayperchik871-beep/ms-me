// Keep the Render server warm 24/7
// Run: node keepalive-server.js
// Or:  start /B node keepalive-server.js   (background)

const url = 'https://ms-messenger-server.onrender.com/health'
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)

async function ping() {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    log(`OK (${res.status})`)
  } catch (e) {
    log(`FAIL: ${e.message}`)
  }
}

// Initial warmup: 3 parallel pings to wake the server faster
log('Warming server...')
Promise.all([ping(), ping(), ping()])

// Keep alive every 4 minutes (Render sleeps after 15 min of inactivity)
setInterval(ping, 4 * 60 * 1000)
log('Server keepalive started (every 4 min)')
