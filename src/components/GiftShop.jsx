import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function GiftShop({ onClose, preselectUserId }) {
  const { user } = useAuth()
  const [gifts, setGifts] = useState([])
  const [contacts, setContacts] = useState([])
  const [step, setStep] = useState('select')
  const [selectedGift, setSelectedGift] = useState(null)
  const [recipient, setRecipient] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [mcoins, setMcoins] = useState(0)

  useEffect(() => {
    api.getGifts().then((d) => setGifts(d.gifts)).catch(() => {})
    api.getMcoins().then((d) => setMcoins(d.mcoins)).catch(() => {})
    api.getContacts().then((d) => {
      const c = d.contacts || []
      setContacts(c)
      if (preselectUserId) {
        const found = c.find((ct) => ct.userId === preselectUserId)
        if (found) {
          setRecipient(found)
        } else {
          api.getUser(preselectUserId).then((d2) => {
            if (d2.user) setRecipient({ userId: d2.user.userId, name: d2.user.name })
          }).catch(() => {})
        }
      }
    }).catch(() => {})
  }, [preselectUserId])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.userId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = async () => {
    if (!selectedGift || !recipient) return
    setSending(true)
    try {
      const res = await api.sendGift(recipient.userId, selectedGift.id, message || undefined)
      if (res.mcoins !== undefined) setMcoins(res.mcoins)
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
            <h3>{t('Подарок отправлен!')}</h3>
            <p className="modal-desc">{recipient.name} {t('получит ваш подарок')}</p>
            <p style={{ color: '#FFD700', fontSize: 13, marginTop: 8 }}>
              {t('Баланс')}: {mcoins} McoinS
            </p>
            <button className="apple-btn" onClick={onClose} style={{ marginTop: 16 }}>{t('Готово')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="gift-shop-header">
          <h3>{t('🎁 Отправить подарок')}</h3>
          <span className="mcoin-balance">🪙 {mcoins} McoinS</span>
        </div>

        {step === 'select' && (
          <>
            <p className="modal-desc">{t('Выберите подарок')}</p>
            <div className="gift-grid">
              {gifts.map((g) => (
                <button
                  key={g.id}
                  className={`gift-grid-item ${selectedGift?.id === g.id ? 'selected' : ''} ${(mcoins < g.price) ? 'gift-disabled' : ''}`}
                  onClick={() => { if (mcoins >= g.price) { setSelectedGift(g); if (recipient && preselectUserId) { setStep('message') } else { setStep('recipient') } } }}
                >
                  <span className="gift-grid-emoji">{g.emoji}</span>
                  <span className="gift-grid-title">{g.title}</span>
                  <span className="gift-grid-price">🪙 {g.price}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'recipient' && (
          <>
            <p className="modal-desc">{t('Кому отправить')} {selectedGift?.emoji}?</p>
            <div className="modal-search">
              <span className="id-prefix">@</span>
              <input
                type="text"
                placeholder={t('Поиск по имени или ID')}
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
              {filtered.length === 0 && <p className="modal-hint">{t('Нет контактов')}</p>}
            </div>
          </>
        )}

        {step === 'message' && recipient && (
          <>
            <p className="modal-desc">
              {t('Подарок')} {selectedGift?.emoji} {t('для')} <strong>{recipient.name}</strong>
            </p>
            <div className="gift-preview">
              <span style={{ fontSize: 64 }}>{selectedGift?.emoji}</span>
            </div>
            <p style={{ textAlign: 'center', color: '#FFD700', fontSize: 14, marginBottom: 8 }}>
              🪙 {selectedGift?.price} McoinS
            </p>
            <input
              className="gift-message-input"
              type="text"
              placeholder={t('Добавить сообщение (необязательно)')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="apple-btn secondary" onClick={() => setStep('recipient')} style={{ flex: 1 }}>
                {t('Назад')}
              </button>
              <button className="apple-btn" onClick={handleSend} disabled={sending} style={{ flex: 1 }}>
                {sending ? t('Отправка...') : `${t('Отправить')} 🪙${selectedGift?.price}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
