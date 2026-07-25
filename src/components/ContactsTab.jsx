import { useState, useEffect } from 'react'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'

export default function ContactsTab({ onStartChat }) {
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    try { const { contacts: data } = await api.getContacts(); setContacts(data.filter((c) => !c.isSystem)) } catch {}
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userId.includes(searchQuery.toLowerCase())
  )

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h1 className="tab-title">{t('Контакты')}</h1>
      </div>

      <div className="tab-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('Поиск')} className="tab-search-input" />
      </div>

      <div className="chat-list">
        {filtered.length === 0 && (
          <div className="empty-tab">
            <p>{t('Нет контактов')}</p>
            <p className="empty-hint">{t('Добавьте друзей по их ID')}</p>
          </div>
        )}
        {filtered.map((c) => (
          <button key={c.id} className="chat-item" onClick={() => onStartChat?.(null, c.userId)}>
            <div className="avatar" style={{ background: c.profileColor || '#3a3a3e' }}>
              {c.avatar ? <img src={resolveMediaUrl(c.avatar)} alt="" className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = c.name[0] }} /> : <span className="avatar-letter">{c.name[0]}</span>}
            </div>
            <div className="chat-item-content">
              <div className="chat-name">{c.name}</div>
              <div className="chat-preview">@{c.userId}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
