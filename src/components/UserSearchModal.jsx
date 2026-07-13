import { useState, useEffect } from 'react'
import { api } from '../api/client'
import ChatListItem from './ChatListItem'

export default function UserSearchModal({ onClose, onSelectUser }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { users } = await api.searchUsers(query)
        setResults(users)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleAdd = async (user) => {
    setError('')
    try {
      const { chatId } = await api.addContact(user.userId)
      onSelectUser({ ...user, chatId })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3>Найти по ID</h3>
        <p className="modal-desc">Введите ID пользователя (@username)</p>

        <div className="search-box modal-search">
          <span className="id-prefix">@</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="username"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="search-results">
          {loading && <p className="modal-hint">Поиск...</p>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="modal-hint">Пользователь не найден</p>
          )}
          {results.map((u) => (
            <button key={u.id} className="search-result-item" onClick={() => handleAdd(u)}>
              <div className="avatar" style={{ background: '#FFFFFF', color: '#000' }}>{u.name[0]}</div>
              <div>
                <div className="chat-name">{u.name}</div>
                <div className="chat-preview">@{u.userId}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChatListItemSimple({ chat, isActive, onClick }) {
  const peer = chat.peer
  const isBot = peer?.isSystem

  return (
    <button className={`chat-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="avatar-wrap">
        <div className={`avatar ${isBot ? 'avatar-bot' : ''}`} style={{ background: isBot ? '#2C2C2E' : '#FFFFFF', color: isBot ? '#fff' : '#000' }}>
          {isBot ? <img src="/logo.png" alt="" className="avatar-logo" /> : peer?.name?.[0]}
        </div>
      </div>
      <div className="chat-item-content">
        <div className="chat-item-top">
          <span className="chat-name">{peer?.name}</span>
          <span className="chat-time">{chat.lastTime}</span>
        </div>
        <div className="chat-item-bottom">
          <span className="chat-preview">{chat.lastMessage}</span>
          {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
        </div>
      </div>
    </button>
  )
}
