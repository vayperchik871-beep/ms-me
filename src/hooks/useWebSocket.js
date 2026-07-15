import { useEffect, useRef, useCallback } from 'react'
import { getWsUrl, getToken } from '../api/client'

let sharedWs = null
const listeners = new Set()
let reconnectTimer = null

function connectShared() {
  const token = getToken()
  if (!token) {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connectShared, 500)
    return
  }

  if (sharedWs?.readyState === WebSocket.OPEN) return

  const url = getWsUrl()
  if (!url) {
    reconnectTimer = setTimeout(connectShared, 500)
    return
  }

  try {
    const ws = new WebSocket(url)
    sharedWs = ws

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        listeners.forEach((fn) => fn(data))
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      if (sharedWs === ws) sharedWs = null
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (listeners.size > 0) {
        reconnectTimer = setTimeout(connectShared, 1000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  } catch { /* ignore */ }
}

function disconnectShared() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  listeners.clear()
  if (sharedWs) {
    sharedWs.close()
    sharedWs = null
  }
}

export function useWebSocket(onMessage) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const handler = (data) => onMessageRef.current?.(data)
    listeners.add(handler)
    connectShared()
    return () => {
      listeners.delete(handler)
      if (listeners.size === 0) {
        disconnectShared()
      }
    }
  }, [])

  return { ready: sharedWs?.readyState === WebSocket.OPEN }
}

export function reconnectWs() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  if (sharedWs) {
    const old = sharedWs
    sharedWs = null
    old.close()
  }
  connectShared()
}
