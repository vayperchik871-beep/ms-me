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
    setTimeout(onClose, 280)
  }

  if (!user) return (
    <div className="pm-overlay pm-enter" onClick={onClose}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()}>
        <div className="pm-loading"><div className="pm-spinner" /></div>
      </div>
    </div>
  )

  const color = user.profileColor || '#2dd4a8'
  const initials = user.name?.[0]?.toUpperCase() || '?'

  return (
    <div className={`pm-overlay ${closing ? 'pm-exit' : 'pm-enter'}`} onClick={handleClose}>
      <div className={`pm-sheet ${closing ? 'pm-sheet-exit' : 'pm-sheet-enter'}`} onClick={e => e.stopPropagation()}>

        <div className="pm-header" style={{ background: `linear-gradient(160deg, ${color} 0%, ${color}cc 45%, ${color}33 80%, transparent 100%)` }}>
          <button className="pm-close-pill" onClick={handleClose}>{t('Закрыть')}</button>

          <div className="pm-avatar-wrap">
            <div className="pm-avatar" style={{ borderColor: color }}>
              {user.avatar ? (
                <img src={resolveMediaUrl(user.avatar)} alt="" className="pm-avatar-img"
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.pm-avatar-fb').style.display = 'flex' }} />
              ) : null}
              <div className="pm-avatar-fb" style={user.avatar ? { display: 'none' } : {}}>{initials}</div>
            </div>
          </div>

          <h1 className="pm-name">{user.name}</h1>
          <p className="pm-id">@{user.userId}</p>
          <p className="pm-status"><span className="pm-status-dot" />{t('в сети')}</p>

          <div className="pm-actions">
            <button className="pm-action" onClick={() => { onStartChat?.(null, user.userId); handleClose() }}>
              <div className="pm-action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              </div>
              <span>{t('Сообщение')}</span>
            </button>
            <button className="pm-action">
              <div className="pm-action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.07 21 3 13.93 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </div>
              <span>{t('Звонок')}</span>
            </button>
            <button className="pm-action">
              <div className="pm-action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </div>
              <span>{t('Видео')}</span>
            </button>
            <button className="pm-action" onClick={() => setShowGiftShop(true)}>
              <div className="pm-action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
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
                <div className="pm-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-3.5 3-6.5 6.5-6.5s6.5 3 6.5 6.5"/></svg>
                </div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Имя')}</span>
                  <span className="pm-card-value">{user.name}</span>
                </div>
                <span className="pm-chevron">›</span>
              </div>
              <div className="pm-card">
                <div className="pm-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Имя пользователя')}</span>
                  <span className="pm-card-value">@{user.userId}</span>
                </div>
                <span className="pm-chevron">›</span>
              </div>
              {user.birthday && (
                <div className="pm-card">
                  <div className="pm-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="pm-card-text">
                    <span className="pm-card-label">{t('День рождения')}</span>
                    <span className="pm-card-value">{user.birthday}</span>
                  </div>
                  <span className="pm-chevron">›</span>
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
                  <span className="pm-chevron">›</span>
                </div>
              )}
              <div className="pm-card">
                <div className="pm-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Медиа')}</span>
                  <span className="pm-card-value">{t('Ссылки и документы')}</span>
                </div>
                <span className="pm-chevron">›</span>
              </div>
              <div className="pm-card" onClick={() => setShowGiftShop(true)}>
                <div className="pm-card-icon">🎁</div>
                <div className="pm-card-text">
                  <span className="pm-card-label">{t('Подарки')}</span>
                  <span className="pm-card-value">{gifts.length > 0 ? gifts.length : t('Нет подарков')}</span>
                </div>
                <span className="pm-chevron">›</span>
              </div>
            </div>
          </div>

          <div className="pm-section">
            <h3 className="pm-section-title">{t('Общие группы')}</h3>
            <div className="pm-card-group">
              <div className="pm-card pm-card-static">
                <div className="pm-card-text" style={{ textAlign: 'center', width: '100%' }}>
                  <span className="pm-card-value" style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
                    {mutualChats.length > 0 ? `${t('Общих групп')}: ${mutualChats.length}` : t('Общих групп нет')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>

      {showGiftShop && <GiftShop onClose={() => setShowGiftShop(false)} preselectUserId={user.userId} />}
    </div>
  )
}
