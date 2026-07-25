import { useState, useEffect, useCallback } from 'react'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'
import UserSearchModal from './UserSearchModal'

export default function ChatsTab({ activeChatId, onSelectChat, onWsEvent }) {
  const [chats, setChats] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadChats = useCallback(async () => {
    try { const { chats: data } = await api.getChats(); setChats(data) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadChats() }, [loadChats])

  useEffect(() => {
    if (!onWsEvent) return
    const handler = (data) => {
      if (['new_message', 'message_updated', 'message_deleted', 'read_receipt'].includes(data.type)) loadChats()
    }
    onWsEvent(handler)
  }, [onWsEvent, loadChats])

  const filtered = chats.filter((c) =>
    c.peer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peer?.userId?.includes(searchQuery.toLowerCase())
  )

  const handleSelectUser = ({ chatId }) => { loadChats(); onSelectChat(chatId) }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h1 className="tab-title">{t('Чаты')}</h1>
        <button className="tab-header-btn" onClick={() => setShowSearch(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="tab-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('Поиск')} className="tab-search-input" />
      </div>

      <div className="chat-list">
        {loading && <p className="empty-hint">{t('Загрузка...')}</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty-tab">
            <p>{t('Нет чатов')}</p>
            <p className="empty-hint">{t('Найдите человека по ID, чтобы начать общение')}</p>
          </div>
        )}
        {filtered.map((chat) => (
          <button key={chat.id} className={`chat-item ${chat.id === activeChatId ? 'chat-item-active' : ''}`} onClick={() => onSelectChat(chat.id)}>
            <div className="avatar" style={{ background: chat.peer?.profileColor || '#3a3a3e' }}>
              {chat.peer?.avatar ? <img src={resolveMediaUrl(chat.peer.avatar)} alt="" className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = chat.peer?.name?.[0] }} /> : <span className="avatar-letter">{chat.peer?.name?.[0]}</span>}
            </div>
            <div className="chat-item-content">
              <div className="chat-name">{chat.peer?.name}</div>
              <div className="chat-preview">{chat.lastMessage?.text?.slice(0, 40) || t('Нет сообщений')}</div>
            </div>
            {chat.unreadCount > 0 && <div className="chat-badge">{chat.unreadCount}</div>}
          </button>
        ))}
      </div>

      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} onSelectUser={handleSelectUser} />}
    </div>
  )
}
