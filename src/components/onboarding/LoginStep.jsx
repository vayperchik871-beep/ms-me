import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import GoogleSignInButton from '../GoogleSignInButton'
import { t } from '../../i18n'

export default function LoginStep({ onComplete, onNeedsVerify, onSwitchRegister }) {
  const { login } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <h2 className="form-step-title">{t('Вход')}</h2>
      <p className="form-step-desc">{t('ID, номер телефона и пароль')}</p>

      {error && <div className="form-error">{error}</div>}

      <GoogleSignInButton onComplete={onComplete} label={t('Продолжить с Google')} />

      <div className="welcome-divider"><span>{t('или')}</span></div>

      <div className="form-fields">
        <div className="form-field">
          <label>{t('ID или телефон')}</label>
          <div className="id-input-row">
            {!isPhone && <span className="id-prefix">@</span>}
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="@username или +777 000 00 00"
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label>{t('Пароль')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
        </div>
      </div>

      <button type="submit" className="apple-btn" disabled={loading || !userId || !password}>
        {loading ? t('Вход...') : t('Войти')}
      </button>

      <p className="form-switch">
        {t('Нет аккаунта?')} <button type="button" className="text-btn" onClick={onSwitchRegister}>{t('Создать')}</button>
      </p>
    </form>
  )
}
