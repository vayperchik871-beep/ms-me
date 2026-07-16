import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function GiftShop({ onClose }) {
  const { user } = useAuth()
  const [gifts, setGifts] = useState([])
  const [contacts, setContacts] = useState([])
  const [step, setStep] = useState('select') // select → recipient → message → done
  const [selectedGift, setSelectedGift] = useState(null)
  const [recipient, setRecipient] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.getGifts().then((d) => setGifts(d.gifts)).catch(() => {})
    api.getContacts().then((d) => setContacts(d.contacts)).catch(() => {})
  }, [])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.userId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = async () => {
    if (!selectedGift || !recipient) return
    setSending(true)
    try {
      await api.sendGift(recipient.userId, selectedGift.id, message || undefined)
      setDone(true)
    } catch {}
    setSending(false)
  }

  if (done) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-handle" />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{selectedGift.emoji}</div>
            <h3>Подарок отправлен!</h3>
            <p className="modal-desc">{recipient.name} получит ваш подарок</p>
            <button className="apple-btn" onClick={onClose} style={{ marginTop: 16 }}>Готово</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3>🎁 Отправить подарок</h3>

        {step === 'select' && (
          <>
            <p className="modal-desc">Выберите подарок</p>
            <div className="gift-grid">
              {gifts.map((g) => (
                <button
                  key={g.id}
                  className={`gift-grid-item ${selectedGift?.id === g.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedGift(g); setStep('recipient') }}
                >
                  <span className="gift-grid-emoji">{g.emoji}</span>
                  <span className="gift-grid-title">{g.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'recipient' && (
          <>
            <p className="modal-desc">Кому отправить {selectedGift?.emoji}?</p>
            <div className="modal-search">
              <span className="id-prefix">@</span>
              <input
                type="text"
                placeholder="Поиск по имени или ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="gift-recipients">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className={`search-result-item ${recipient?.userId === c.userId ? 'active-acc' : ''}`}
                  onClick={() => { setRecipient(c); setStep('message') }}
                >
                  <div className="avatar avatar-sm">{c.name[0]}</div>
                  <div>
                    <div>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{c.userId}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="modal-hint">Нет контактов</p>}
            </div>
          </>
        )}

        {step === 'message' && recipient && (
          <>
            <p className="modal-desc">
              Подарок {selectedGift?.emoji} для <strong>{recipient.name}</strong>
            </p>
            <div className="gift-preview">
              <span style={{ fontSize: 64 }}>{selectedGift?.emoji}</span>
            </div>
            <input
              className="gift-message-input"
              type="text"
              placeholder="Добавить сообщение (необязательно)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="apple-btn secondary" onClick={() => setStep('recipient')} style={{ flex: 1 }}>
                Назад
              </button>
              <button className="apple-btn" onClick={handleSend} disabled={sending} style={{ flex: 1 }}>
                {sending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
