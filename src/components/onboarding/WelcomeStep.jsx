import GoogleSignInButton from '../GoogleSignInButton'

export default function WelcomeStep({ onRegister, onLogin, onComplete, onRegisterEmail, onLoginEmail }) {
  return (
    <div className="welcome-step">
      <div className="welcome-logo-wrap">
        <img src="/logo.png" alt="MS Messenger" className="welcome-logo" />
      </div>
      <h1 className="welcome-title">MS Messenger</h1>
      <p className="welcome-subtitle">
        Безопасные сообщения.<br />Регистрация по email или номеру.
      </p>

      <GoogleSignInButton onComplete={onComplete} label="Продолжить с Google" />

      <div className="welcome-divider"><span>или</span></div>

      <button className="apple-btn" onClick={onRegisterEmail}>По email</button>
      <button className="apple-btn secondary" onClick={onRegister} style={{ marginTop: 8 }}>По номеру +777</button>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button className="apple-btn secondary" onClick={onLoginEmail} style={{ flex: 1 }}>Войти (email)</button>
        <button className="apple-btn secondary" onClick={onLogin} style={{ flex: 1 }}>Войти (ID/телефон)</button>
      </div>

      <p className="welcome-legal">
        Продолжая, вы соглашаетесь с{' '}
        <a href="/PRIVACY.md" target="_blank" rel="noreferrer">Политикой конфиденциальности</a>
      </p>
    </div>
  )
}
