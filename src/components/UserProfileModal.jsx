import { useState, useEffect } from 'react'
import { api, resolveMediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

const genderLabel = (g) => {
  if (g === 'male') return t('Мужской')
  if (g === 'female') return t('Женский')
  if (g === 'other') return t('Другой')
  return g || '—'
}

export default function UserProfileModal({ userId, onClose, onStartChat }) {
  const { user: me } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const isMe = me?.id === userId || me?.userId === userId

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.getUser(userId)
      .then((data) => setProfile(data.user || data))
      .catch(() => onClose?.())
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  const handleAction = (action) => {
    if (action === 'message') {
      if (profile?.userId) {
        api.addContact(profile.userId).then(({ chatId }) => {
          onStartChat?.(chatId, profile.userId)
          onClose?.()
        }).catch(() => {})
      }
    }
  }

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-sheet pm-sheet-full" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="pm-loading">
            <div className="pm-spinner" />
          </div>
        ) : (
          <>
            <div className="pm-header">
              <button className="pm-close-pill" onClick={onClose}>{t('Закрыть')}</button>

              <div className="pm-avatar-wrap">
                <div className="pm-avatar" style={profile?.profileColor ? { background: profile.profileColor + '33', borderColor: profile.profileColor + '66' } : {}}>
                  {profile?.avatar ? (
                    <img src={resolveMediaUrl(profile.avatar)} alt="" className="pm-avatar-img"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.pm-avatar-fb').style.display = 'flex' }} />
                  ) : null}
                  <div className="pm-avatar-fb" style={profile?.avatar ? { display: 'none' } : {}}>
                    {profile?.name?.[0] || '?'}
                  </div>
                </div>
              </div>

              <h2 className="pm-name">{profile?.name}</h2>
              <p className="pm-id">@{profile?.userId}</p>
              <p className="pm-status">
                <span className="pm-status-dot" style={profile?.online ? {} : { background: '#636366' }} />
                {profile?.online ? t('в сети') : t('недавно')}
              </p>

              <div className="pm-actions">
                <button className="pm-action" onClick={() => handleAction('message')}>
                  <div className="pm-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <span>{t('Сообщение')}</span>
                </button>
                <button className="pm-action pm-action-disabled">
                  <div className="pm-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <span>{t('Звонок')}</span>
                </button>
                <button className="pm-action pm-action-disabled">
                  <div className="pm-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  </div>
                  <span>{t('Видео')}</span>
                </button>
                <button className="pm-action pm-action-disabled">
                  <div className="pm-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                    </svg>
                  </div>
                  <span>{t('Поделиться')}</span>
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
                      <span className="pm-card-label">{t('Имя пользователя')}</span>
                      <span className="pm-card-value">@{profile?.userId}</span>
                    </div>
                    <span className="pm-chevron">›</span>
                  </div>

                  {profile?.birthday && (
                    <div className="pm-card">
                      <div className="pm-card-icon">📅</div>
                      <div className="pm-card-text">
                        <span className="pm-card-label">{t('День рождения')}</span>
                        <span className="pm-card-value">{profile.birthday}</span>
                      </div>
                      <span className="pm-chevron">›</span>
                    </div>
                  )}

                  {profile?.gender && (
                    <div className="pm-card">
                      <div className="pm-card-icon">👤</div>
                      <div className="pm-card-text">
                        <span className="pm-card-label">{t('Пол')}</span>
                        <span className="pm-card-value">{genderLabel(profile.gender)}</span>
                      </div>
                      <span className="pm-chevron">›</span>
                    </div>
                  )}

                  <div className="pm-card pm-card-static">
                    <div className="pm-card-icon">📁</div>
                    <div className="pm-card-text">
                      <span className="pm-card-label">{t('Медиа, ссылки и документы')}</span>
                    </div>
                    <span className="pm-chevron">›</span>
                  </div>

                  <div className="pm-card pm-card-static">
                    <div className="pm-card-icon">🎁</div>
                    <div className="pm-card-text">
                      <span className="pm-card-label">{t('Подарки')}<span className="pm-card-badge">{t('скоро')}</span></span>
                    </div>
                    <span className="pm-chevron">›</span>
                  </div>
                </div>
              </div>

              <div className="pm-section">
                <h3 className="pm-section-title">{t('Общие группы')}</h3>
                <div className="pm-card-group">
                  <div className="pm-card pm-card-static">
                    <span className="pm-card-label" style={{ width: '100%', textAlign: 'center', padding: '4px 0' }}>{t('Общих групп нет')}</span>
                  </div>
                </div>
              </div>

              <div style={{ height: 40 }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
