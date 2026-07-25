import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { setLanguage, getLanguage, t } from '../../i18n'
import GoogleSignInButton from '../GoogleSignInButton'

export default function WelcomeStep({ onRegister, onLogin, onComplete }) {
  const { theme, toggleTheme } = useTheme()
  const lang = getLanguage()
  const [showLang, setShowLang] = useState(false)

  const switchLang = (code) => {
    setLanguage(code)
    setShowLang(false)
    window.location.reload()
  }

  return (
    <div className="welcome-step">
      <button className="corner-btn corner-lang" onClick={() => setShowLang(!showLang)}>
        {lang === 'ru' ? 'Русский' : 'English'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {showLang && (
        <div className="lang-dropdown">
          <button className={`lang-option ${lang === 'ru' ? 'active' : ''}`} onClick={() => switchLang('ru')}>Русский</button>
          <button className={`lang-option ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLang('en')}>English</button>
        </div>
      )}

      <button className="corner-btn corner-theme" onClick={toggleTheme}>
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        )}
      </button>

      <div className="welcome-main">
        <div className="welcome-logo-wrap">
          <img src="/logo.png" alt="MS Messenger" className="welcome-logo" />
        </div>
        <h1 className="welcome-title">MS Messenger</h1>
      </div>

      <div className="welcome-actions">
        <GoogleSignInButton onComplete={onComplete} label={t('Продолжить с Google')} />
        <div className="welcome-divider"><span>{t('или')}</span></div>
        <button className="apple-btn" onClick={onRegister}>{t('Регистрация')}</button>
        <div className="welcome-btn-gap" />
        <button className="apple-btn secondary" onClick={onLogin}>{t('Вход')}</button>
      </div>
    </div>
  )
}
