import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RegisterEmail({ onComplete, onSwitchLogin, onBack }) {
  const { registerEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) { setError('Введите корректный email'); return }
    if (cleanUsername.length < 3) { setError('Username минимум 3 символа'); return }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }

    setLoading(true)
    try {
      await registerEmail(email.trim(), cleanUsername, password, name.trim())
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-step" onSubmit={handleSubmit}>
      {onBack && (
        <button type="button" className="onboarding-back" onClick={onBack} aria-label="Назад">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="form-step-icon">📧</div>
      <h2 className="form-step-title">Регистрация</h2>
      <p className="form-step-desc">Email, username и пароль</p>

      {error && <div className="form-error">{error}</div>}

      <div className="profile-fields">
        <div className="profile-field">
          <label>Email</label>
          <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="profile-field">
          <label>Username</label>
          <div className="id-input-row">
            <span className="id-prefix">@</span>
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" required maxLength={20} />
          </div>
        </div>
        <div className="profile-field">
          <label>Имя (необязательно)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" maxLength={40} />
        </div>
        <div className="profile-field">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
        </div>
        <div className="profile-field">
          <label>Повторите пароль</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••" required />
        </div>
      </div>

      <button type="submit" className="apple-btn" disabled={loading || !email || !username || password.length < 6 || password !== confirm}>
        {loading ? 'Создание...' : 'Создать аккаунт'}
      </button>

      <p className="form-switch">
        Уже есть аккаунт? <button type="button" className="text-btn" onClick={onSwitchLogin}>Войти</button>
      </p>
    </form>
  )
}
