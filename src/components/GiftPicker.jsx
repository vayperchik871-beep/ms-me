import { useState, useRef } from 'react'
import { t } from '../i18n'
import gifts, { CATEGORIES, RARITIES } from '../data/gifts'

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

const CATEGORY_LABELS = {
  all: t('Все'),
  popular: t('Популярные'),
  new: t('Новые'),
  limited: t('Лимитированные'),
  collectible: t('Коллекционные'),
}

export default function GiftPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const scrollRef = useRef(null)

  const filtered = activeCategory === 'all'
    ? gifts
    : gifts.filter(g => g.category === activeCategory)

  return (
    <div className="g-overlay" onClick={onClose}>
      <div className="g-sheet" onClick={e => e.stopPropagation()}>
        <div className="g-header">
          <h2 className="g-title">{t('Подарки')}</h2>
          <button className="g-close" onClick={onClose}>✕</button>
        </div>

        <div className="g-categories" ref={scrollRef}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`g-cat-pill ${activeCategory === cat ? 'g-cat-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="g-grid">
          {filtered.map(gift => {
            const rarityColor = RARITY_COLORS[gift.rarity]
            const remaining = gift.limited && gift.totalSupply
              ? gift.totalSupply - gift.sold
              : null

            return (
              <button
                key={gift.id}
                className="g-card"
                onClick={() => onSelect(gift)}
              >
                <div className="g-card-icon-wrap" style={{ '--g-glow': rarityColor }}>
                  <span className="g-card-icon">{gift.icon}</span>
                </div>
                <div className="g-card-info">
                  <span className="g-card-name">{gift.name}</span>
                  <span className="g-card-price">🪙 {gift.price}</span>
                </div>
                <span className="g-rarity-badge" style={{ background: rarityColor }}>
                  {RARITY_LABELS[gift.rarity]}
                </span>
                {gift.limited && remaining !== null && (
                  <div className="g-limited-bar-wrap">
                    <div className="g-limited-bar">
                      <div
                        className="g-limited-fill"
                        style={{ width: `${(gift.sold / gift.totalSupply) * 100}%` }}
                      />
                    </div>
                    <span className="g-limited-text">{t('Осталось')} {remaining}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
