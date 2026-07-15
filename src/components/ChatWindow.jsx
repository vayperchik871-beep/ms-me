import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import MessageContextMenu from './MessageContextMenu'

export default function ChatWindow({ chatId, onBack }) {
  const { user } = useAuth()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [editId, setEditId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
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

  useWebSocket((data) => {
    if (data.type === 'new_message' && data.chatId === chatId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message?.id)) return prev
        return data.message ? [...prev, data.message] : prev
      })
    }
    if (data.type === 'message_updated' && data.message?.chatId === chatId) {
      setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)))
    }
    if (data.type === 'message_deleted' && data.chatId === chatId) {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
    }
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text, attachment) => {
    if (!text.trim() && !attachment) return
    try {
      if (editId) {
        const { message } = await api.editMessage(editId, text)
        setMessages((prev) => prev.map((m) => (m.id === editId ? message : m)))
        setEditId(null)
      } else {
        const { message } = await api.sendMessage(chatId, text, replyTo?.id, attachment)
        setMessages((prev) => [...prev, message])
        setReplyTo(null)
      }
    } catch { /* ignore */ }
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

  return (
    <main className="chat-window full">
      <header className="chat-header dark">
        <button className="back-btn" onClick={onBack} aria-label="Назад">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="chat-header-info">
          <div className={`avatar avatar-sm ${isBot ? 'avatar-bot' : ''}`} style={{ background: isBot ? '#2C2C2E' : '#FFFFFF', color: isBot ? '#fff' : '#000' }}>
            {isBot ? <img src="/logo.png" alt="" className="avatar-logo" /> : peer?.avatar ? <img src={peer.avatar} alt="" className="avatar-img" /> : peer?.name?.[0]}
          </div>
          <div className="chat-header-text">
            <h2>{peer?.name}</h2>
            <span className="status">{isBot ? 'бот' : `@${peer?.userId}`}</span>
          </div>
          <svg className="header-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        <button className="icon-btn" aria-label="Ещё">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </header>

      <div className="messages-area dark">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Здесь пока нет сообщений</p>
            <p className="empty-hint">Отправьте сообщение, чтобы начать</p>
            <div className="quick-emojis">
              <button onClick={() => handleSend('👋')}>👋</button>
              <button onClick={() => handleSend('🤝')}>🤝</button>
              <button onClick={() => handleSend('✌️')}>✌️</button>
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
            <span className="reply-label">Ответ</span>
            <span className="reply-text">{replyTo.text}</span>
          </div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <InputBar
        onSend={handleSend}
        editText={editId ? messages.find((m) => m.id === editId)?.text : ''}
        onCancelEdit={() => setEditId(null)}
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
