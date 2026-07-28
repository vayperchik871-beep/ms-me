import { useState } from 'react'
import { t } from '../i18n'
import { RARITIES } from '../data/gifts'

const RARITY_COLORS = {
  [RARITIES.COMMON]: '#8e8e93',
  [RARITIES.RARE]: '#5ac8fa',
  [RARITIES.EPIC]: '#af52de',
  [RARITIES.LEGENDARY]: '#ff9500',
  [RARITIES.MYTHIC]: '#ff3b30',
}

export default function GiftConfirm({ gift, recipientName, onConfirm, onClose }) {
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  return (
    <div className="g-overlay" onClick={onClose}>
      <div className="g-sheet g-confirm" onClick={e => e.stopPropagation()}>
        <div className="g-header">
          <h2 className="g-title">{t('Подтверждение')}</h2>
          <button className="g-close" onClick={onClose}>✕</button>
        </div>

        <div className="g-confirm-hero">
          <div
            className="g-confirm-icon-wrap"
            style={{ '--g-glow': RARITY_COLORS[gift.rarity] }}
          >
            <span className="g-confirm-icon">{gift.icon}</span>
          </div>
          <h3 className="g-confirm-name">{gift.name}</h3>
          <span
            className="g-rarity-badge g-rarity-badge-lg"
            style={{ background: RARITY_COLORS[gift.rarity] }}
          >
            {t(gift.rarity)}
          </span>
          <div className="g-confirm-price">🪙 {gift.price}</div>
          <div className="g-confirm-recipient">
            {t('Кому')}: {recipientName}
          </div>
        </div>

        <textarea
          className="g-message-input"
          placeholder={t('Добавить сообщение (необязательно)')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={200}
          rows={3}
        />

        <label className="g-toggle-row">
          <span className="g-toggle-label">{t('Отправить анонимно')}</span>
          <div
            className={`g-toggle ${anonymous ? 'g-toggle-on' : ''}`}
            onClick={() => setAnonymous(a => !a)}
          >
            <div className="g-toggle-knob" />
          </div>
        </label>

        <button
          className="g-send-btn"
          style={{ background: RARITY_COLORS[gift.rarity] }}
          onClick={() => onConfirm({ gift, message, anonymous })}
        >
          {t('Отправить подарок')} 🎁
        </button>
      </div>
    </div>
  )
}
