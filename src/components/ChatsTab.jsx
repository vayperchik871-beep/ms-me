import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import AppHeader from './AppHeader'
import { ChatListItemSimple } from './UserSearchModal'
import UserSearchModal from './UserSearchModal'

export default function ChatsTab({ activeChatId, onSelectChat, onWsEvent }) {
  const [chats, setChats] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadChats = useCallback(async () => {
    try {
      const { chats: data } = await api.getChats()
      setChats(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadChats() }, [loadChats])

  useEffect(() => {
    if (!onWsEvent) return
    const handler = (data) => {
      if (data.type === 'new_message' || data.type === 'message_updated' || data.type === 'message_deleted') {
        loadChats()
      }
    }
    onWsEvent(handler)
  }, [onWsEvent, loadChats])

  const filtered = chats.filter((c) =>
    c.peer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peer?.userId?.includes(searchQuery.toLowerCase())
  )

  const handleSelectUser = ({ chatId }) => {
    loadChats()
    onSelectChat(chatId)
  }

  return (
    <div className="tab-content">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCompose={() => setShowSearch(true)}
      />

      <div className="chat-list">
        {loading && <p className="empty-hint">Загрузка...</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty-tab">
            <p>Нет чатов</p>
            <p className="empty-hint">Найдите человека по ID, чтобы начать общение</p>
            <button className="apple-btn small" onClick={() => setShowSearch(true)}>Найти по ID</button>
          </div>
        )}
        {filtered.map((chat) => (
          <ChatListItemSimple
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onClick={() => onSelectChat(chat.id)}
          />
        ))}
      </div>

      {showSearch && (
        <UserSearchModal onClose={() => setShowSearch(false)} onSelectUser={handleSelectUser} />
      )}
    </div>
  )
}
