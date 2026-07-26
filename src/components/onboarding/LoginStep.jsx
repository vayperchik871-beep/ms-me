import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
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
    <div className="nw-step">
      <button className="nw-back" onClick={onSwitchRegister}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        {t('Назад')}
      </button>

      <div className="nw-step-content" style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 0 }}>
        <h2 className="nw-title" style={{ textAlign: 'center' }}>{t('Вход')}</h2>
        <p className="nw-subtitle" style={{ textAlign: 'center', margin: '0 auto 32px' }}>{t('ID, номер телефона и пароль')}</p>

        {error && <div className="nw-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="nw-field">
            <input
              className="nw-field-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={isPhone ? '+777 000 00 00' : '@username'}
              required
              autoComplete="username"
            />
          </div>
          <div className="nw-field">
            <input
              className="nw-field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Пароль')}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="nw-btn-primary" disabled={loading || !userId || !password} style={{ marginTop: 8 }}>
            {loading ? t('Вход...') : t('Войти')}
          </button>
        </form>

        <p className="nw-login-link" style={{ marginTop: 24 }}>
          {t('Нет аккаунта?')} <button type="button" onClick={onSwitchRegister} className="nw-login-text">{t('Создать')}</button>
        </p>
      </div>
    </div>
  )
}
