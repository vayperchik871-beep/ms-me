import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { setLanguage, getLanguage, t } from '../../i18n'

export default function WelcomeStep({ onStart, onLogin }) {
  const { theme, toggleTheme } = useTheme()
  const lang = getLanguage()
  const [showLang, setShowLang] = useState(false)

  const switchLang = (code) => {
    setLanguage(code)
    setShowLang(false)
    window.location.reload()
  }

  return (
    <div className="nw-step">
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

      <div className="nw-welcome-card">
        <div className="nw-logo-wrap">
          <div className="nw-logo">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="bubbleGrad" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#4a4a52"/>
                  <stop offset="100%" stopColor="#2a2a30"/>
                </radialGradient>
                <filter id="bubbleShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.3"/>
                </filter>
              </defs>
              <path d="M60 16C34 16 14 34 14 56C14 68 20 78 30 84L26 100L44 90C49 92 54 93 60 93C86 93 106 75 106 53C106 31 86 16 60 16Z" fill="url(#bubbleGrad)" filter="url(#bubbleShadow)"/>
              <text x="60" y="64" textAnchor="middle" fill="#e8e8ec" fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif" fontSize="36" fontWeight="700" letterSpacing="-1">MS</text>
            </svg>
          </div>
        </div>

        <h1 className="nw-welcome-title">MS Messenger</h1>
        <p className="nw-welcome-subtitle">{t('Безопасный и быстрый мессенджер')}</p>
      </div>

      <div className="nw-welcome-bottom">
        <button className="nw-btn-primary" onClick={onStart}>{t('Начать')}</button>
        <p className="nw-login-link">
          {t('Уже есть аккаунт?')} <button type="button" onClick={onLogin} className="nw-login-text">{t('Войти')}</button>
        </p>
      </div>
    </div>
  )
}
