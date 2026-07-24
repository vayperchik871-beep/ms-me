import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function RegisterStep({ onComplete, onSwitchLogin }) {
  const { register, canAddAccount } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+777')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
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
    const digits = val.replace(/\D/g, '')
    if (!digits.startsWith('777')) return '+777'
    let formatted = '+777'
    if (digits.length > 3) formatted += ` ${digits.slice(3, 6)}`
    if (digits.length > 6) formatted += ` ${digits.slice(6, 8)}`
    if (digits.length > 8) formatted += ` ${digits.slice(8, 10)}`
    if (digits.length > 10) formatted += ` ${digits.slice(10)}`
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!canAddAccount) { setError('На устройстве уже 2 аккаунта'); return }
    if (!name.trim()) { setError('Введите имя'); return }
    if (!phoneValid) { setError('Номер: +777 и минимум 2 цифры'); return }
    if (cleanId.length < 3) { setError('ID минимум 3 символа'); return }
    if (idAvailable === false) { setError('Этот ID уже занят'); return }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }

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
    <form className="form-step" onSubmit={handleSubmit}>
      <div className="form-step-icon">👤</div>
      <h2 className="form-step-title">Создать аккаунт</h2>
      <p className="form-step-desc">Заполните все поля</p>

      {error && <div className="form-error">{error}</div>}

      <div className="register-avatar-wrap-center">
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
      </div>

      <div className="profile-fields">
        <div className="profile-field">
          <label>Имя</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" required maxLength={40} />
        </div>
        <div className="profile-field">
          <label>Номер +777</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+777 000 00 00" required />
        </div>
        <div className="profile-field">
          <label>Username</label>
          <div className="id-input-row">
            <span className="id-prefix">@</span>
            <input value={userId} onChange={(e) => handleIdChange(e.target.value)} placeholder="username" required maxLength={20} />
            {checkingId && <span className="id-checking">⋯</span>}
            {idAvailable === true && <span className="id-ok">✓</span>}
            {idAvailable === false && <span className="id-taken">✗</span>}
          </div>
        </div>
        <div className="profile-field">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
        </div>
      </div>

      <button type="submit" className="apple-btn" disabled={loading || !name.trim() || !phoneValid || cleanId.length < 3 || idAvailable === false || password.length < 6}>
        {loading ? 'Создание...' : 'Создать аккаунт'}
      </button>

      <p className="form-switch">
        Уже есть аккаунт? <button type="button" className="text-btn" onClick={onSwitchLogin}>Войти</button>
      </p>
    </form>
  )
}
