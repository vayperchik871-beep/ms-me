import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function Clicker({ onClose }) {
  const [clicks, setClicks] = useState(0)
  const [mcoins, setMcoins] = useState(0)
  const [earned, setEarned] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    api.getMcoins().then((d) => setMcoins(d.mcoins)).catch(() => {})
  }, [])

  const handleClick = () => {
    if (clicks >= 100) return
    setClicks((c) => c + 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 100)
  }

  const handleClaim = async () => {
    if (clicks < 100) return
    try {
      const res = await api.earnMcoins(clicks)
      setMcoins(res.mcoins || 0)
      setEarned((e) => e + (res.earned || 0))
      setClicks(0)
    } catch {}
  }

  const progress = Math.min(clicks / 100, 1)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3>{t('🪙 Кликер')}</h3>
        <p className="modal-desc">{t('Нажимай на кнопку чтобы заработать McoinS')}</p>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          {t('За 100 кликов — 10 McoinS')}
        </p>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#FFD700' }}>{clicks}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('Кликов')}</div>
        </div>

        <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, margin: '0 20px 20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: '#FFD700', borderRadius: 4, transition: 'width 0.2s' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            className={`clicker-btn ${animating ? 'clicker-btn-press' : ''}`}
            onClick={handleClick}
            disabled={clicks >= 100}
          >
            🪙
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, padding: '0 20px' }}>
          <button className="apple-btn secondary" onClick={onClose} style={{ flex: 1 }}>
            {t('Назад')}
          </button>
          <button
            className="apple-btn"
            onClick={handleClaim}
            disabled={clicks < 100}
            style={{ flex: 1 }}
          >
            {t('Получить')} 🪙{Math.floor(clicks / 100) * 10}
          </button>
        </div>

        {earned > 0 && (
          <p style={{ textAlign: 'center', color: '#FFD700', fontSize: 14, marginTop: 16 }}>
            {t('Всего заработано')}: {earned} McoinS
          </p>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          {t('Баланс')}: {mcoins} McoinS
        </p>
      </div>
    </div>
  )
}