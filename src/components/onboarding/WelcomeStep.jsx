import GoogleSignInButton from '../GoogleSignInButton'

export default function WelcomeStep({ onRegister, onLogin, onComplete }) {
  return (
    <div className="welcome-step">
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
