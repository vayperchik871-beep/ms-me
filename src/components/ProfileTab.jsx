import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'
import ProfileEditor from './ProfileEditor'
import VerificationDetailScreen from './VerificationDetailScreen'
import VerificationApplyModal from './VerificationApplyModal'
import VerificationBadge from './VerificationBadge'

const GENDERS_VALUES = { male: 'Мужской', female: 'Женский', other: 'Другой' }
const genderLabel = (g) => t(GENDERS_VALUES[g]) || g

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
      <div className="pf-top-bar">
        <button className="pf-edit-pill" onClick={() => setShowEditor(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      <div className="pf-hero-wrap">
        <div className="pf-hero">
          <div className="pf-avatar" onClick={() => fileInputRef.current?.click()}>
            {user?.avatar ? (
              <img src={resolveMediaUrl(user.avatar)} alt="" className="pf-avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('pf-avatar-fallback') }} />
            ) : null}
            <span className="pf-avatar-letter">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

          <h1 className="pf-name">{user?.name}</h1>
          <div className="pf-id">@{user?.userId}</div>
          <div className="pf-status">
            <span className="pf-status-dot" />
            <span>{t('онлайн')}</span>
          </div>
        </div>
      </div>

      <p className="capsule-section-label" style={{ marginTop: 2 }}>{t('Информация')}</p>
      <div className="pf-card">
        {user?.bio ? (
          <>
            <div className="pf-card-row">
              <span className="pf-card-label">{t('О себе')}</span>
              <span className="pf-card-value pf-card-value--right">{user.bio}</span>
            </div>
            <div className="pf-card-divider" />
          </>
        ) : null}
        <div className="pf-card-row">
          <span className="pf-card-label">{t('День рождения')}</span>
          <span className="pf-card-value pf-card-value--right">{user?.birthday || '—'}</span>
        </div>
        <div className="pf-card-divider" />
        <div className="pf-card-row">
          <span className="pf-card-label">{t('Пол')}</span>
          <span className="pf-card-value pf-card-value--right">{genderLabel(user?.gender) || '—'}</span>
        </div>
        <div className="pf-card-divider" />
        <button className="pf-card-row pf-card-btn" onClick={() => setShowVerify(true)}>
          <span className="pf-card-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('Верификация')}
            {verifyStatus?.verified && <VerificationBadge size={14} />}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3 }}><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {accounts.length > 1 && (
        <>
          <p className="capsule-section-label">{t('Аккаунты')}</p>
          <div className="pf-card">
            {accounts.map((a, i) => (
              <div key={a.userId}>
                {i > 0 && <div className="pf-card-divider" />}
                <button
                  className={`pf-card-row pf-card-btn ${a.userId === user?.userId ? 'pf-card-active' : ''}`}
                  onClick={() => switchToAccount(a.userId)}
                >
                  <span className="pf-card-label">{a.name} <span style={{ opacity: 0.4 }}>@{a.userId}</span></span>
                  {a.userId === user?.userId && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </button>
              </div>
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
