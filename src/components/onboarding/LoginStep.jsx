import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginStep({ onComplete, onNeedsVerify, onSwitchRegister }) {
  const { login } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cleanId = userId.toLowerCase().replace(/[^a-z0-9_]/g, '')
      const result = await login(cleanId, password)
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
      <p className="form-step-desc">Введите ваш ID и пароль</p>

      {error && <div className="form-error">{error}</div>}

      <div className="profile-fields">
        <div className={`profile-field ${focused === 'id' ? 'focused' : ''}`}>
          <label>ID</label>
          <div className="id-input-row">
            <span className="id-prefix">@</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onFocus={() => setFocused('id')}
              onBlur={() => setFocused('')}
              placeholder="username"
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
