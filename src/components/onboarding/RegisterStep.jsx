import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { t } from '../../i18n'
import { api } from '../../api/client'

export default function RegisterStep({ onComplete, onSwitchLogin }) {
  const { register, canAddAccount } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+777')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [idAvailable, setIdAvailable] = useState(null)
  const [checkingId, setCheckingId] = useState(false)
  const fileInputRef = useRef(null)
  const checkTimer = useRef(null)

  const cleanId = userId.toLowerCase().replace(/[^a-z0-9_]/g, '')
  const initial = name.trim()[0]?.toUpperCase() || '?'
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneValid = phoneDigits.length >= 5 && phoneDigits.startsWith('777')

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (!digits.startsWith('777')) return '+777'
    let formatted = '+777'
    if (digits.length > 3) formatted += ` ${digits.slice(3, 6)}`
    if (digits.length > 6) formatted += ` ${digits.slice(6, 8)}`
    if (digits.length > 8) formatted += ` ${digits.slice(8, 10)}`
    return formatted
  }

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleIdChange = (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUserId(cleaned)
    setIdAvailable(null)
    if (cleaned.length < 3) return
    clearTimeout(checkTimer.current)
    setCheckingId(true)
    checkTimer.current = setTimeout(async () => {
      try {
        const { available } = await api.checkId(cleaned)
        setIdAvailable(available)
      } catch {}
      setCheckingId(false)
    }, 400)
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      if (!name.trim()) { setError(t('Введите имя')); return }
      if (cleanId.length < 3) { setError(t('ID минимум 3 символа')); return }
      if (idAvailable === false) { setError(t('Этот ID уже занят')); return }
      setStep(2)
    } else if (step === 2) {
      if (!phoneValid) { setError(t('Номер: +777 и минимум 2 цифры')); return }
      setStep(3)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!canAddAccount) { setError(t('На устройстве уже 2 аккаунта. Удалите один в настройках.')); return }
    if (password.length < 6) { setError(t('Минимум 6 символов')); return }
    if (password !== confirmPassword) { setError(t('Пароли не совпадают')); return }

    setLoading(true)
    try {
      const fullPhone = `+${phoneDigits}`
      await register(name.trim(), cleanId, password, fullPhone)
      if (avatarFile) { try { await api.uploadAvatar(avatarFile) } catch {} }
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-step" onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
      <div className="step-indicator">
        <span className={`step-dot${step === 1 ? ' active' : ''}`} />
        <span className="step-line" />
        <span className={`step-dot${step === 2 ? ' active' : ''}`} />
        <span className="step-line" />
        <span className={`step-dot${step === 3 ? ' active' : ''}`} />
      </div>

      <p className="step-count">{t('Шаг')} {step} {t('из')} 3</p>

      {step === 1 && (
        <>
          <h2 className="form-step-title">{t('Как вас зовут?')}</h2>
          <p className="form-step-desc">{t('Это имя увидят другие пользователи')}</p>

          {error && <div className="form-error">{error}</div>}

          <div className="register-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="register-avatar-img" />
            ) : (
              <div className="register-avatar clickable">{initial}</div>
            )}
            <div className="avatar-add-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v16M4 12h16"/></svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />

          <div className="form-fields">
            <div className="form-field">
              <label>{t('Имя')}</label>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ваше имя')} required maxLength={40} />
            </div>
            <div className="form-field">
              <label>{t('Username')}</label>
              <div className="id-input-row">
                <span className="id-prefix">@</span>
                <input value={userId} onChange={(e) => handleIdChange(e.target.value)} placeholder="username" required maxLength={20} />
                {checkingId && <span className="id-checking">...</span>}
                {idAvailable === true && <span className="id-ok">&#10003;</span>}
                {idAvailable === false && <span className="id-taken">&#10007;</span>}
              </div>
            </div>
          </div>

          <button type="submit" className="apple-btn" disabled={!name.trim() || cleanId.length < 3 || idAvailable === false}>
            {t('Продолжить')}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="form-step-title">{t('Ваш номер')}</h2>
          <p className="form-step-desc">{t('Номер +777 — без подтверждения')}</p>

          {error && <div className="form-error">{error}</div>}

          <div className="form-fields">
            <div className="form-field">
              <label>{t('Номер +777')}</label>
              <input type="tel" autoFocus value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+777 000 00 00" required />
            </div>
          </div>

          <button type="submit" className="apple-btn" disabled={!phoneValid}>
            {t('Продолжить')}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="form-step-title">{t('Защитите аккаунт')}</h2>
          <p className="form-step-desc">{t('Минимум 6 символов')}</p>

          {error && <div className="form-error">{error}</div>}

          <div className="form-fields">
            <div className="form-field">
              <label>{t('Пароль')}</label>
              <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('Минимум 6 символов')} required minLength={6} />
            </div>
            <div className="form-field">
              <label>{t('Повторите пароль')}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('Повторите пароль')} required minLength={6} />
            </div>
          </div>

          <button type="submit" className="apple-btn" disabled={loading || password.length < 6 || password !== confirmPassword}>
            {loading ? t('Создание...') : t('Создать аккаунт')}
          </button>
        </>
      )}

      <p className="form-switch">
        {t('Уже есть аккаунт?')} <button type="button" className="text-btn" onClick={onSwitchLogin}>{t('Войти')}</button>
      </p>
    </form>
  )
}
