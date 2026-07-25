import { useState, useRef, useEffect } from 'react'
import { t } from '../../i18n'
import { api } from '../../api/client'

export default function CredentialsStep({ phone, onNext, onBack }) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [idAvailable, setIdAvailable] = useState(null)
  const [checkingId, setCheckingId] = useState(false)
  const idRef = useRef(null)
  const checkTimer = useRef(null)

  const cleanId = userId.toLowerCase().replace(/[^a-z0-9_]/g, '')
  const isValid = cleanId.length >= 3 && password.length >= 6

  useEffect(() => { idRef.current?.focus() }, [])

  const handleIdChange = (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 12)
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

  return (
    <div className="nw-step">
      <button className="nw-back" onClick={onBack}>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{t('Назад')}</span>
      </button>

      <div className="nw-step-content">
        <h1 className="nw-title">{t('Создайте ID и пароль')}</h1>
        <p className="nw-subtitle">{t('Уникальный ID для входа в приложение')}</p>

        <div className="nw-fields">
          <div className="nw-field">
            <input
              ref={idRef}
              type="text"
              value={userId}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder={t('ID')}
              className="nw-field-input"
              maxLength={12}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {userId.length >= 3 && (
              <div className="nw-field-status">
                {checkingId ? (
                  <span className="nw-id-loading" />
                ) : idAvailable === true ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : idAvailable === false ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                ) : null}
              </div>
            )}
          </div>

          <div className="nw-field">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Пароль')}
              className="nw-field-input"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="nw-step-bottom">
          <button className="nw-btn-primary" disabled={!isValid} onClick={() => onNext({ userId: cleanId, password })}>
            {t('Далее')}
          </button>
        </div>
      </div>
    </div>
  )
}
