import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'
import ProfileEditor from './ProfileEditor'
import VerificationDetailScreen from './VerificationDetailScreen'
import VerificationApplyModal from './VerificationApplyModal'
import VerificationBadge from './VerificationBadge'

const genderLabel = (g) => {
  if (g === 'male') return t('Мужской')
  if (g === 'female') return t('Женский')
  if (g === 'other') return t('Другой')
  return g
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const months = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
  return `${months[d.getMonth()]} ${d.getFullYear()} г.`
}

export default function ProfileTab() {
  const { user, accounts, switchToAccount, refreshUser } = useAuth()
  const fileInputRef = useRef(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showVerifyApply, setShowVerifyApply] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState(null)

  useEffect(() => {
    api.getVerifyStatus().then(setVerifyStatus).catch(() => {})
  }, [])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await api.uploadAvatar(file)
      refreshUser()
    } catch {}
  }

  return (
    <div className="tab-content pf-screen">
      {/* Edit capsule — top right */}
      <button className="pf-edit-capsule" onClick={() => setShowEditor(true)}>
        {t('Редактировать')}
      </button>

      {/* Hero */}
      <div className="pf-hero">
        <div className="pf-avatar" onClick={() => fileInputRef.current?.click()}>
          {user?.avatar ? (
            <img src={resolveMediaUrl(user.avatar)} alt="" className="pf-avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('pf-avatar-fallback') }} />
          ) : null}
          <span className="pf-avatar-letter">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

        <h1 className="pf-name">{user?.name}</h1>

        <div className="pf-status">
          <span className="pf-status-dot" />
          <span>{t('онлайн')}</span>
        </div>
      </div>

      {/* Info card */}
      <div className="pf-card">
        <div className="pf-card-row">
          <span className="pf-card-label">ID</span>
          <span className="pf-card-value">{user?.userId}</span>
        </div>
        <div className="pf-card-divider" />
        <div className="pf-card-row">
          <span className="pf-card-label">{t('Дата регистрации')}</span>
          <span className="pf-card-value">{formatDate(user?.createdAt)}</span>
        </div>
      </div>

      {/* Details card */}
      <div className="pf-card">
        <div className="pf-card-row">
          <div>
            <span className="pf-card-label">{t('Имя пользователя')}</span>
            <span className="pf-card-value pf-card-link">@{user?.userId}</span>
          </div>
        </div>
        <div className="pf-card-divider" />
        <div className="pf-card-row">
          <div>
            <span className="pf-card-label">{t('О себе')}</span>
            <span className="pf-card-value">{user?.bio || '—'}</span>
          </div>
        </div>
        {user?.birthday && (
          <>
            <div className="pf-card-divider" />
            <div className="pf-card-row">
              <div>
                <span className="pf-card-label">{t('День рождения')}</span>
                <span className="pf-card-value">{user?.birthday}</span>
              </div>
            </div>
          </>
        )}
        {user?.gender && (
          <>
            <div className="pf-card-divider" />
            <div className="pf-card-row">
              <div>
                <span className="pf-card-label">{t('Пол')}</span>
                <span className="pf-card-value">{genderLabel(user?.gender)}</span>
              </div>
            </div>
          </>
        )}
        <div className="pf-card-divider" />
        <button className="pf-card-row pf-card-btn" onClick={() => setShowVerify(true)}>
          <span className="pf-card-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('Верификация')}
            {verifyStatus?.verified && <VerificationBadge size={14} />}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3 }}><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Accounts */}
      {accounts.length > 1 && (
        <div className="pf-card">
          {accounts.map((a, i) => (
            <div key={a.userId}>
              {i > 0 && <div className="pf-card-divider" />}
              <button
                className={`pf-card-row pf-card-btn ${a.userId === user?.userId ? 'pf-card-active' : ''}`}
                onClick={() => switchToAccount(a.userId)}
              >
                <span className="pf-card-value">{a.name} <span style={{ opacity: 0.4 }}>@{a.userId}</span></span>
                {a.userId === user?.userId && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {showEditor && <ProfileEditor onClose={() => setShowEditor(false)} />}
      {showVerify && (
        <VerificationDetailScreen
          onClose={() => setShowVerify(false)}
          onApply={() => { setShowVerify(false); setShowVerifyApply(true) }}
        />
      )}
      {showVerifyApply && (
        <VerificationApplyModal
          onClose={() => setShowVerifyApply(false)}
          onSubmitted={() => { setShowVerifyApply(false); api.getVerifyStatus().then(setVerifyStatus).catch(() => {}) }}
        />
      )}
    </div>
  )
}
