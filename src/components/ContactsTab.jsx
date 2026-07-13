import { useState, useEffect } from 'react'
import { api } from '../api/client'
import AppHeader from './AppHeader'
import UserSearchModal from './UserSearchModal'

export default function ContactsTab({ onStartChat }) {
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const load = async () => {
    try {
      const { contacts: data } = await api.getContacts()
      setContacts(data.filter((c) => !c.isSystem))
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userId.includes(searchQuery.toLowerCase())
  )

  const handleAdd = async ({ chatId }) => {
    await load()
    if (chatId) onStartChat?.(chatId)
  }

  return (
    <div className="tab-content">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCompose={() => setShowSearch(true)}
      />

      <div className="chat-list">
        {filtered.length === 0 && (
          <div className="empty-tab">
            <p>Нет контактов</p>
            <p className="empty-hint">Добавьте друзей по их ID</p>
            <button className="apple-btn small" onClick={() => setShowSearch(true)}>Добавить</button>
          </div>
        )}
        {filtered.map((c) => (
          <button key={c.id} className="chat-item" onClick={() => onStartChat?.(null, c.userId)}>
            <div className="avatar" style={{ background: '#FFFFFF', color: '#000' }}>{c.name[0]}</div>
            <div className="chat-item-content">
              <div className="chat-name">{c.name}</div>
              <div className="chat-preview">@{c.userId}</div>
            </div>
          </button>
        ))}
      </div>

      {showSearch && (
        <UserSearchModal onClose={() => setShowSearch(false)} onSelectUser={handleAdd} />
      )}
    </div>
  )
}
