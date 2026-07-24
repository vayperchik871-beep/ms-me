import { useTheme } from '../../context/ThemeContext'
import { setLanguage, getLanguage } from '../../i18n'
import GoogleSignInButton from '../GoogleSignInButton'

export default function WelcomeStep({ onRegister, onLogin, onComplete }) {
  const { theme, toggleTheme } = useTheme()
  const lang = getLanguage()

  const toggleLang = () => {
    setLanguage(lang === 'ru' ? 'en' : 'ru')
    window.location.reload()
  }

  return (
    <div className="welcome-step">
      <button className="corner-btn corner-lang" onClick={toggleLang}>
        {lang === 'ru' ? 'EN' : 'RU'}
      </button>
      <button className="corner-btn corner-theme" onClick={toggleTheme}>
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>

      <div className="welcome-main">
        <div className="welcome-logo-wrap">
          <img src="/logo.png" alt="MS Messenger" className="welcome-logo" />
        </div>
        <h1 className="welcome-title">MS Messenger</h1>
      </div>

      <div className="welcome-actions">
        <GoogleSignInButton onComplete={onComplete} label="Продолжить с Google" />
        <div className="welcome-divider"><span>или</span></div>
        <button className="apple-btn" onClick={onRegister}>Регистрация</button>
        <button className="apple-btn secondary" onClick={onLogin}>Вход</button>
      </div>
    </div>
  )
}
