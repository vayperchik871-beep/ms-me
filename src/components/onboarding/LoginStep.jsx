import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import GoogleSignInButton from '../GoogleSignInButton'

export default function LoginStep({ onComplete, onNeedsVerify, onSwitchRegister }) {
  const { login } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const isPhone = userId.startsWith('+') || (userId.replace(/\D/g, '').length >= 10)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loginId = isPhone
        ? '+' + userId.replace(/\D/g, '')
        : userId.toLowerCase().replace(/[^a-z0-9_]/g, '')
      const result = await login(loginId, password)
      if (result.needsVerification) {
        onNeedsVerify(result.userId)
      } else {
        onComplete()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-step" onSubmit={handleSubmit}>
      <div className="form-step-icon">👋</div>
      <h2 className="form-step-title">Вход</h2>
      <p className="form-step-desc">ID, номер телефона и пароль</p>

      {error && <div className="form-error">{error}</div>}

      <GoogleSignInButton onComplete={onComplete} label="Войти через Google" />

      <div className="welcome-divider"><span>или</span></div>

      <div className="profile-fields">
        <div className={`profile-field ${focused === 'id' ? 'focused' : ''}`}>
          <label>ID или телефон</label>
          <div className="id-input-row">
            {!isPhone && <span className="id-prefix">@</span>}
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onFocus={() => setFocused('id')}
              onBlur={() => setFocused('')}
              placeholder="@username или +7 (777) 000-00-00"
              required
            />
          </div>
        </div>
        <div className={`profile-field ${focused === 'pass' ? 'focused' : ''}`}>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused('pass')}
            onBlur={() => setFocused('')}
            placeholder="••••••"
            required
          />
        </div>
      </div>

      <button type="submit" className="apple-btn" disabled={loading || !userId || !password}>
        {loading ? 'Вход...' : 'Войти'}
      </button>

      <p className="form-switch">
        Нет аккаунта? <button type="button" className="text-btn" onClick={onSwitchRegister}>Создать</button>
      </p>
    </form>
  )
}
