import { t } from '../i18n'
import { RARITIES } from '../data/gifts'

const RARITY_COLORS = {
  [RARITIES.COMMON]: '#8e8e93',
  [RARITIES.RARE]: '#5ac8fa',
  [RARITIES.EPIC]: '#af52de',
  [RARITIES.LEGENDARY]: '#ff9500',
  [RARITIES.MYTHIC]: '#ff3b30',
}

const RARITY_LABELS = {
  [RARITIES.COMMON]: t('Обычный'),
  [RARITIES.RARE]: t('Редкий'),
  [RARITIES.EPIC]: t('Эпический'),
  [RARITIES.LEGENDARY]: t('Легендарный'),
  [RARITIES.MYTHIC]: t('Мифический'),
}

export default function GiftProfile({ gift, onBack }) {
  const color = RARITY_COLORS[gift.rarity]

  return (
    <div className="g-profile-screen">
      <div className="g-profile-header">
        <button className="g-profile-back" onClick={onBack}>←</button>
        <h2 className="g-profile-title">{t('Подарок')}</h2>
      </div>

      <div className="g-profile-hero">
        <div
          className="g-profile-emoji-wrap"
          style={{ '--g-glow': color }}
        >
          <span className="g-profile-emoji">{gift.icon}</span>
        </div>

        <h1 className="g-profile-name">{gift.name}</h1>

        <span
          className="g-rarity-badge g-rarity-badge-lg"
          style={{ background: color, boxShadow: `0 0 16px ${color}44` }}
        >
          {RARITY_LABELS[gift.rarity]}
        </span>
      </div>

      <div className="g-profile-body">
        <p className="g-profile-desc">{gift.description}</p>

        <div className="g-profile-details">
          {gift.owner && (
            <div className="g-profile-row">
              <span className="g-profile-label">{t('Владелец')}</span>
              <span className="g-profile-value">{gift.owner}</span>
            </div>
          )}
          {gift.receivedAt && (
            <div className="g-profile-row">
              <span className="g-profile-label">{t('Получен')}</span>
              <span className="g-profile-value">{gift.receivedAt}</span>
            </div>
          )}
          <div className="g-profile-row">
            <span className="g-profile-label">{t('Цена')}</span>
            <span className="g-profile-value">🪙 {gift.price}</span>
          </div>
          {gift.limited && gift.totalSupply && (
            <div className="g-profile-row">
              <span className="g-profile-label">{t('Серийный номер')}</span>
              <span className="g-profile-value">
                #{gift.sold} / {gift.totalSupply}
              </span>
            </div>
          )}
        </div>

        {gift.limited && (
          <div className="g-profile-limited-info">
            <div className="g-limited-bar g-limited-bar-lg">
              <div
                className="g-limited-fill"
                style={{ width: `${(gift.sold / gift.totalSupply) * 100}%` }}
              />
            </div>
            <span className="g-profile-limited-text">
              {t('Лимитированная серия')} · {t('Осталось')} {gift.totalSupply - gift.sold}
            </span>
          </div>
        )}
      </div>

      <div className="g-profile-footer">
        <button
          className="g-share-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: gift.name,
                text: `${gift.name} — ${gift.description}`,
              })
            }
          }}
        >
          {t('Поделиться')}
        </button>
      </div>
    </div>
  )
}
