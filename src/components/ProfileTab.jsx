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
    <div className="tab-content profile-tab">
      <div className="profile-header">
        <div className="profile-avatar-large clickable" onClick={() => fileInputRef.current?.click()}>
          {user?.avatar ? (
            <img src={resolveMediaUrl(user.avatar)} alt="" className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = user.name?.[0] || '?' }} />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
          <div className="avatar-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v16M4 12h16"/></svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <h2>{user?.name}</h2>
        <p className="profile-id">@{user?.userId}</p>
        {verifyStatus?.verified && (
          <div className="profile-verified">
            <VerificationBadge size={16} />
            <span>{t('Верифицирован')}</span>
          </div>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-item">
          <span>{t('Имя')}</span>
          <span className="settings-value">{user?.name}</span>
        </div>
        <div className="settings-item">
          <span>{t('ID')}</span>
          <span className="settings-value">@{user?.userId}</span>
        </div>
        <div className="settings-item">
          <span>{t('День рождения')}</span>
          <span className="settings-value">{user?.birthday || '—'}</span>
        </div>
        <div className="settings-item">
          <span>{t('Пол')}</span>
          <span className="settings-value">{genderLabel(user?.gender) || '—'}</span>
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: 12 }}>
        <button className="settings-item clickable" onClick={() => setShowEditor(true)}>
          <span>{t('Редактировать профиль')}</span>
          <span className="settings-arrow">›</span>
        </button>
        <button className="settings-item clickable" onClick={() => setShowVerify(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#00C7BE"/><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {t('Верификация')}
          </span>
          <span className="settings-arrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {verifyStatus?.verified && <VerificationBadge size={14} />}
            ›
          </span>
        </button>
      </div>

      {accounts.length > 1 && (
        <>
          <h3 className="section-title">{t('Аккаунты на устройстве')}</h3>
          <div className="settings-group">
            {accounts.map((a) => (
              <button
                key={a.userId}
                className={`settings-item clickable ${a.userId === user?.userId ? 'active-acc' : ''}`}
                onClick={() => switchToAccount(a.userId)}
              >
                <span>{a.name}</span>
                <span className="settings-value">@{a.userId}</span>
              </button>
            ))}
          </div>
        </>
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
