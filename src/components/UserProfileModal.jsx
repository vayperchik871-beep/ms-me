import { useState, useEffect } from 'react'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'
import GiftShop from './GiftShop'

export default function UserProfileModal({ userId, onClose, onStartChat }) {
  const [user, setUser] = useState(null)
  const [mutualChats, setMutualChats] = useState([])
  const [gifts, setGifts] = useState([])
  const [showGiftShop, setShowGiftShop] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!userId) return
    api.getUser(userId).then((d) => {
      setUser(d.user)
      setMutualChats(d.mutualChats || [])
    }).catch(() => onClose())
    api.getUserGifts(userId).then((d) => setGifts(d.gifts || [])).catch(() => {})
  }, [userId])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 250)
  }

  if (!user) return (
    <div className="pm-overlay pm-enter" onClick={onClose}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()}>
        <div className="pm-loading">
          <div className="pm-spinner" />
        </div>
      </div>
    </div>
  )

  const color = user.profileColor || '#007AFF'
  const initials = user.name?.[0]?.toUpperCase() || '?'

  return (
    <div className={`pm-overlay ${closing ? 'pm-exit' : 'pm-enter'}`} onClick={handleClose}>
      <div className={`pm-sheet ${closing ? 'pm-sheet-exit' : 'pm-sheet-enter'}`}
        onClick={e => e.stopPropagation()}
        style={{ '--accent': color }}
      >
        <div className="pm-header" style={{ background: `linear-gradient(160deg, ${color}, ${color}88 60%, var(--bg-primary) 100%)` }}>
          <button className="pm-close" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="pm-avatar-wrap">
            <div className="pm-avatar">
              {user.avatar ? (
                <img src={resolveMediaUrl(user.avatar)} alt="" className="pm-avatar-img"
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.pm-avatar-fallback').style.display = 'flex' }} />
              ) : null}
              <div className="pm-avatar-fallback" style={user.avatar ? { display: 'none' } : {}}>
                {initials}
              </div>
            </div>
          </div>

          <h1 className="pm-name">{user.name}</h1>
          <p className="pm-id">@{user.userId}</p>

          <div className="pm-actions">
            <button className="pm-action" onClick={() => { onStartChat?.(null, user.userId); handleClose() }}>
              <div className="pm-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <span>{t('Сообщение')}</span>
            </button>
            <button className="pm-action">
              <div className="pm-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <span>{t('Звонок')}</span>
            </button>
            <button className="pm-action">
              <div className="pm-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <span>{t('Видео')}</span>
            </button>
            <button className="pm-action" onClick={() => setShowGiftShop(true)}>
              <div className="pm-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              </div>
              <span>{t('Подарок')}</span>
            </button>
          </div>
        </div>

        <div className="pm-body">
          <div className="pm-section">
            <h3 className="pm-section-title">{t('Информация')}</h3>
            <div className="pm-card-group">
              <div className="pm-card">
                <div className="pm-card-icon">@</div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Имя')}</span>
                  <span className="pm-card-value">{user.name}</span>
                </div>
              </div>
              {user.birthday && (
                <div className="pm-card">
                  <div className="pm-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="pm-card-text">
                    <span className="pm-card-label">{t('День рождения')}</span>
                    <span className="pm-card-value">{user.birthday}</span>
                  </div>
                </div>
              )}
              {user.gender && (
                <div className="pm-card">
                  <div className="pm-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="5"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                  </div>
                  <div className="pm-card-text">
                    <span className="pm-card-label">{t('Пол')}</span>
                    <span className="pm-card-value">{user.gender === 'male' ? t('Мужской') : user.gender === 'female' ? t('Женский') : user.gender === 'other' ? t('Другой') : user.gender}</span>
                  </div>
                </div>
              )}
              <div className="pm-card" onClick={() => setShowGiftShop(true)}>
                <div className="pm-card-icon">🎁</div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Подарки')}</span>
                  <span className="pm-card-value">{gifts.length > 0 ? `${gifts.length} ${t('подарков')}` : t('Нет подарков')}</span>
                </div>
                <span className="pm-card-chevron">›</span>
              </div>
            </div>
          </div>

          <div className="pm-section">
            <h3 className="pm-section-title">{t('Общие группы')}</h3>
            <div className="pm-card-group">
              <div className="pm-card pm-card-static">
                <div className="pm-card-text">
                  <span className="pm-card-value" style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
                    {mutualChats.length > 0 ? `${t('Общих групп')}: ${mutualChats.length}` : t('Общих групп нет')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>

      {showGiftShop && <GiftShop onClose={() => setShowGiftShop(false)} preselectUserId={user.userId} />}
    </div>
  )
}