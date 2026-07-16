import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import MessageContextMenu from './MessageContextMenu'
import { parseEmoji } from '../utils/emoji'
import { resolveMediaUrl } from '../api/client'

export default function ChatWindow({ chatId, onBack }) {
  const { user } = useAuth()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [editId, setEditId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [typingUserId, setTypingUserId] = useState(null)
  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

  const loadChat = useCallback(async () => {
    try {
      const { chats } = await api.getChats()
      const c = chats.find((ch) => ch.id === chatId)
      setChat(c)
      const { messages: msgs } = await api.getMessages(chatId)
      setMessages(msgs)
    } catch { /* ignore */ }
  }, [chatId])

  useEffect(() => { loadChat() }, [loadChat])

  useEffect(() => {
    api.readChat(chatId).catch(() => {})
  }, [chatId])

  useEffect(() => {
    const interval = setInterval(() => {
      api.readChat(chatId).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [chatId])

  useWebSocket((data) => {
    if (data.type === 'new_message' && data.chatId === chatId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message?.id)) return prev
        return data.message ? [...prev, data.message] : prev
      })
      api.readChat(chatId).catch(() => {})
      if (data.message?.senderId !== user?.id) playNotify()
    }
    if (data.type === 'message_updated' && data.message?.chatId === chatId) {
      setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)))
    }
    if (data.type === 'message_deleted' && data.chatId === chatId) {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
    }
    if (data.type === 'read_receipt' && data.chatId === chatId) {
      setMessages((prev) => prev.map((m) => m.senderId === user?.id ? { ...m, read: true } : m))
    }
    if ((data.type === 'user_online' || data.type === 'user_offline') && data.userId) {
      setChat((prev) => {
        if (!prev?.peer || prev.peer.userId !== data.userId) return prev
        return {
          ...prev,
          peer: {
            ...prev.peer,
            online: data.type === 'user_online',
            lastSeen: data.type === 'user_offline' ? Date.now() : prev.peer.lastSeen,
          },
        }
      })
    }
    if (data.type === 'typing' && data.chatId === chatId && data.userId && data.userId !== user?.id) {
      if (data.isTyping) {
        setTypingUserId(data.userId)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000)
      } else {
        setTypingUserId(null)
      }
    }
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text, attachment) => {
    if (!text.trim() && !attachment) return
    if (editId) {
      try {
        const { message } = await api.editMessage(editId, text)
        setMessages((prev) => prev.map((m) => (m.id === editId ? message : m)))
        setEditId(null)
      } catch { /* ignore */ }
      return
    }
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id: tempId,
      chatId,
      senderId: user?.id,
      senderUserId: user?.userId,
      senderName: user?.name,
      text,
      replyTo: replyTo?.id || null,
      attachment,
      createdAt: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
      edited: false,
      pinned: false,
      read: false,
    }
    setMessages((prev) => [...prev, optimistic])
    setReplyTo(null)
    try {
      const { message } = await api.sendMessage(chatId, text, replyTo?.id, attachment)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    }
  }

  const handleContextAction = async (action) => {
    const msg = contextMenu?.message
    if (!msg) return

    switch (action) {
      case 'reply':
        setReplyTo(msg)
        break
      case 'copy':
        navigator.clipboard?.writeText(msg.text)
        break
      case 'edit':
        setEditId(msg.id)
        break
      case 'delete':
        await api.deleteMessage(msg.id)
        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
        break
      case 'pin':
        await api.pinMessage(msg.id)
        loadChat()
        break
      case 'favorite':
        await api.favoriteMessage(msg.id)
        break
      case 'select':
        setSelectMode(true)
        setSelected(new Set([msg.id]))
        break
      case 'forward':
        navigator.clipboard?.writeText(msg.text)
        break
      default:
        break
    }
  }

  const handleLongPress = (message, e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      message,
      position: { x: Math.min(rect.left, window.innerWidth - 260), y: Math.min(rect.top - 60, window.innerHeight - 400) },
    })
  }

  const peer = chat?.peer
  const isBot = peer?.isSystem

  const formatLastSeen = (ts) => {
    if (!ts) return ''
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин. назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч. назад`
    const days = Math.floor(hours / 24)
    return `${days} дн. назад`
  }

  const statusText = typingUserId
    ? 'печатает...'
    : peer?.online
      ? 'в сети'
      : peer?.lastSeen
        ? `был(а) ${formatLastSeen(peer.lastSeen)}`
        : ''

  return (
    <main className="chat-window full">
      <header className="chat-header dark">
        <button className="back-btn" onClick={onBack} aria-label="Назад">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="chat-header-center">
          <h2 className="chat-header-name">{peer?.name}</h2>
          <span className={`chat-header-status ${typingUserId ? 'typing' : ''} ${peer?.online ? 'online' : ''}`}>
            {statusText}
          </span>
        </div>

        <div className="chat-header-avatar">
          {isBot ? (
            <div className="chat-avatar-circle bot">
              <img src="/logo.png" alt="" className="avatar-logo" />
            </div>
          ) : peer?.avatar ? (
            <div className="chat-avatar-circle">
              <img src={resolveMediaUrl(peer.avatar)} alt="" className="avatar-img" />
            </div>
          ) : (
            <div className="chat-avatar-circle">
              {peer?.name?.[0]}
            </div>
          )}
        </div>
      </header>

      <div className="messages-area dark">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Здесь пока нет сообщений</p>
            <p className="empty-hint">Отправьте сообщение, чтобы начать</p>
            <div className="quick-emojis">
              {['👋', '🤝', '✌️'].map((emoji) => (
                <button key={emoji} onClick={() => handleSend(emoji)} dangerouslySetInnerHTML={{ __html: parseEmoji(emoji) }} />
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              selected={selected.has(msg.id)}
              selectMode={selectMode}
              onLongPress={handleLongPress}
              onClick={() => {
                if (selectMode) {
                  setSelected((prev) => {
                    const next = new Set(prev)
                    next.has(msg.id) ? next.delete(msg.id) : next.add(msg.id)
                    return next
                  })
                }
              }}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="reply-bar">
          <div>
            <span className="reply-label">Ответ {replyTo.senderName || 'пользователю'}</span>
            <span className="reply-text">{replyTo.text}</span>
          </div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <InputBar
        onSend={handleSend}
        editText={editId ? messages.find((m) => m.id === editId)?.text : ''}
        onCancelEdit={() => setEditId(null)}
        chatId={chatId}
      />

      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          isMine={contextMenu.message.senderId === user?.id}
          position={contextMenu.position}
          onAction={handleContextAction}
          onReact={(emoji) => api.reactMessage(contextMenu.message.id, emoji).then(loadChat)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </main>
  )
}

function playNotify() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {}
}
