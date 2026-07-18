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
    <div className="tab-content capsule-screen">
      <div className="capsule-profile-hero">
        <div className="capsule-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
          <div className="capsule-avatar">
            {user?.avatar ? (
              <img src={resolveMediaUrl(user.avatar)} alt="" className="capsule-avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = user.name?.[0] || '?' }} />
            ) : (
              <span>{user?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="capsule-avatar-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <h2 className="capsule-name">{user?.name}</h2>
        <p className="capsule-handle">@{user?.userId}</p>
        {verifyStatus?.verified && (
          <div className="capsule-verified-badge">
            <VerificationBadge size={16} />
            <span>{t('Верифицирован')}</span>
          </div>
        )}
      </div>

      <div className="capsule-section">
        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Имя')}</span>
            <span className="capsule-item-value">{user?.name}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">ID</span>
            <span className="capsule-item-value">@{user?.userId}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('День рождения')}</span>
            <span className="capsule-item-value">{user?.birthday || '—'}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Пол')}</span>
            <span className="capsule-item-value">{genderLabel(user?.gender) || '—'}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div className="capsule-section">
        <button className="capsule-item clickable" onClick={() => setShowEditor(true)}>
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Редактировать профиль')}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <button className="capsule-item clickable" onClick={() => setShowVerify(true)}>
          <div className="capsule-item-icon capsule-item-icon--teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5DDCD0" strokeWidth="2" strokeLinecap="round"><path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Верификация')}</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {verifyStatus?.verified && <VerificationBadge size={14} />}
            <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </button>
      </div>

      {accounts.length > 1 && (
        <>
          <p className="capsule-section-label">{t('Аккаунты на устройстве')}</p>
          <div className="capsule-section">
            {accounts.map((a) => (
              <button
                key={a.userId}
                className={`capsule-item clickable ${a.userId === user?.userId ? 'capsule-active' : ''}`}
                onClick={() => switchToAccount(a.userId)}
              >
                <div className="capsule-item-icon">
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#5DDCD0' }}>{a.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="capsule-item-content">
                  <span className="capsule-item-title">{a.name}</span>
                  <span className="capsule-item-value">@{a.userId}</span>
                </div>
                {a.userId === user?.userId && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5DDCD0" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                )}
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
