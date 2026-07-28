import { useEffect, useState } from 'react'
import { t } from '../i18n'

const CONFETTI_COLORS = ['#ff3b30', '#ff9500', '#ffcc02', '#34c759', '#5ac8fa', '#af52de', '#ff6b6b', '#64d2ff', '#fff']

function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))
}

export default function GiftAnimation({ gift, fromName, onThanks, onOpen }) {
  const [visible, setVisible] = useState(false)
  const particles = makeParticles(24)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="g-anim-overlay">
      <div className="g-anim-bg" />
      <div className="g-anim-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="g-anim-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              background: p.color,
              width: p.size,
              height: p.size,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      <div className="g-anim-content">
        <div className={`g-anim-emoji-wrap ${visible ? 'g-anim-emoji-visible' : ''}`}>
          <span className="g-anim-emoji">{gift.icon}</span>
        </div>

        <h2 className="g-anim-title">{t('Вам подарок!')}</h2>

        <div className="g-anim-details">
          <span className="g-anim-gift-name">{gift.name}</span>
          <span className="g-anim-from">{t('От')} {fromName}</span>
        </div>

        <div className="g-anim-actions">
          <button className="g-anim-btn g-anim-btn-thanks" onClick={onThanks}>
            {t('Спасибо')}
          </button>
          <button className="g-anim-btn g-anim-btn-open" onClick={onOpen}>
            {t('Открыть')}
          </button>
        </div>
      </div>
    </div>
  )
}
