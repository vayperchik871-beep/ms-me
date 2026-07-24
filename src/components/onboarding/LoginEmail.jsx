import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginEmail({ onComplete, onSwitchRegister, onBack }) {
  const { loginEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginEmail(email.trim(), password)
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

      <div className="form-step-icon">🔑</div>
      <h2 className="form-step-title">Вход по email</h2>
      <p className="form-step-desc">Введите email и пароль</p>

      {error && <div className="form-error">{error}</div>}

      <div className="profile-fields">
        <div className="profile-field">
          <label>Email</label>
          <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="profile-field">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
        </div>
      </div>

      <button type="submit" className="apple-btn" disabled={loading || !email || !password}>
        {loading ? 'Вход...' : 'Войти'}
      </button>

      <p className="form-switch">
        Нет аккаунта? <button type="button" className="text-btn" onClick={onSwitchRegister}>Создать</button>
      </p>
    </form>
  )
}
