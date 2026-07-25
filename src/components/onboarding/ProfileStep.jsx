import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { t } from '../../i18n'
import { api } from '../../api/client'

export default function ProfileStep({ phone, userId, password, onComplete, onBack }) {
  const { register, canAddAccount } = useAuth()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError(t('Введите имя')); return }
    setError('')

    setLoading(true)
    try {
      if (!canAddAccount) { setError(t('На устройстве уже 2 аккаунта. Удалите один в настройках.')); setLoading(false); return }
      await register(name.trim(), userId, password, phone)
      if (avatarFile) { try { await api.uploadAvatar(avatarFile) } catch {} }
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nw-step">
      <button className="nw-back" onClick={onBack}>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{t('Назад')}</span>
      </button>

      <div className="nw-step-content">
        <h1 className="nw-title">{t('Заполните профиль')}</h1>
        <p className="nw-subtitle">{t('Расскажите о себе')}</p>

        <div className="nw-avatar-section">
          <button className="nw-avatar-btn" onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="nw-avatar-img" />
            ) : (
              <div className="nw-avatar-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
        </div>

        {error && <div className="nw-error">{error}</div>}

        <div className="nw-fields">
          <div className="nw-field">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Имя')}
              className="nw-field-input"
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="nw-field">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('О себе')}
              className="nw-field-input"
              maxLength={100}
            />
          </div>
        </div>

        <div className="nw-step-bottom">
          <button className="nw-btn-primary" disabled={!name.trim() || loading} onClick={handleSubmit}>
            {loading ? t('Создание...') : t('Зарегистрироваться')}
          </button>
        </div>
      </div>
    </div>
  )
}
