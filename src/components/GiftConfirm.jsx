import { useState, useEffect } from 'react'
import { t } from '../i18n'
import { RARITIES } from '../data/gifts'
import { api } from '../api/client'

const RARITY_LABELS = {
  [RARITIES.COMMON]: t('Обычный'),
  [RARITIES.RARE]: t('Редкий'),
  [RARITIES.EPIC]: t('Эпический'),
  [RARITIES.LEGENDARY]: t('Легендарный'),
  [RARITIES.MYTHIC]: t('Мифический'),
}

export default function GiftConfirm({ gift, recipient, onSent, onClose }) {
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [recipientId, setRecipientId] = useState(recipient?.userId || '')
  const [recipientName, setRecipientName] = useState(recipient?.name || '')
  const [contacts, setContacts] = useState([])
  const [showRecipients, setShowRecipients] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getContacts()
      .then(({ contacts = [] }) => setContacts(contacts))
      .catch(() => setContacts([]))
  }, [])

  const gradient = gift.colors?.length
    ? `linear-gradient(160deg, ${gift.colors.join(', ')})`
    : 'linear-gradient(160deg, #8e8e93, #636366)'

  const pickRecipient = (u) => {
    setRecipientId(u.userId)
    setRecipientName(u.name)
    setShowRecipients(false)
  }

  const handleSend = async () => {
    if (!recipientId || sending) return
    setSending(true)
    setError(null)
    try {
      await api.sendGift(recipientId, gift.id, message.trim() || undefined)
      onSent?.({ gift, message: message.trim(), anonymous, recipientName })
    } catch (err) {
      setError(err.message || t('Ошибка отправки'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="gc-overlay" style={{ background: gradient }}>
      <div className="gc-shade" onClick={onClose} />

      <div className="gc-screen" onClick={e => e.stopPropagation()}>
        <div className="gc-topbar">
          <button className="gc-close" onClick={onClose} aria-label={t('Закрыть')}>✕</button>
        </div>

        <div className="gc-hero">
          <div className="gc-icon-wrap" style={{ '--g-glow': gift.colors?.[0] }}>
            <span className="gc-icon">{gift.icon}</span>
          </div>
          <h2 className="gc-name">{gift.name}</h2>
          <span className="gc-rarity">{RARITY_LABELS[gift.rarity]}</span>
        </div>

        <div className="gc-controls">
          <div className="gc-field">
            <div className="gc-field-label">{t('Кому подарить')}</div>
            <button
              type="button"
              className="gc-recipient-btn"
              onClick={() => setShowRecipients(v => !v)}
            >
              <span className="gc-recipient-name">{recipientName || t('Выбрать получателя')}</span>
              <span className={`gc-chevron ${showRecipients ? 'gc-chevron-open' : ''}`}>▾</span>
            </button>

            {showRecipients && (
              <div className="gc-recipient-list">
                {recipient?.userId && (
                  <button type="button" className="gc-recipient-item" onClick={() => pickRecipient(recipient)}>
                    <span className="gc-recipient-avatar">{recipient.name?.[0] || '?'}</span>
                    <span>{recipient.name}</span>
                    {recipientId === recipient.userId && <span className="gc-check">✓</span>}
                  </button>
                )}
                {contacts
                  .filter(c => c.userId !== recipient?.userId)
                  .map(c => (
                    <button key={c.userId} type="button" className="gc-recipient-item" onClick={() => pickRecipient(c)}>
                      <span className="gc-recipient-avatar">{c.name?.[0] || '?'}</span>
                      <span>{c.name}</span>
                      {recipientId === c.userId && <span className="gc-check">✓</span>}
                    </button>
                  ))}
                {(!recipient?.userId && contacts.length === 0) && (
                  <div className="gc-recipient-empty">{t('Нет контактов')}</div>
                )}
              </div>
            )}
          </div>

          <textarea
            className="gc-caption"
            placeholder={t('Подпись (необязательно)')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            rows={2}
          />

          <label className="gc-toggle-row">
            <span className="gc-toggle-label">{t('Отправить анонимно')}</span>
            <div
              className={`g-toggle ${anonymous ? 'g-toggle-on' : ''}`}
              onClick={() => setAnonymous(a => !a)}
            >
              <div className="g-toggle-knob" />
            </div>
          </label>
        </div>

        {error && <div className="gc-error">{error}</div>}

        <div className="gc-footer">
          <button className="gc-send-btn" onClick={handleSend} disabled={sending}>
            {sending ? t('Отправка...') : `${t('Подарить')} 🎁`}
          </button>
          <div className="gc-price">🪙 {gift.price}</div>
        </div>
      </div>
    </div>
  )
}