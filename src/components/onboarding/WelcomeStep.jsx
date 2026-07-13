export default function WelcomeStep({ onRegister, onLogin }) {
  return (
    <div className="welcome-step">
      <div className="welcome-logo-wrap">
        <img src="/logo.png" alt="MS Messenger" className="welcome-logo" />
      </div>
      <h1 className="welcome-title">MS Messenger</h1>
      <p className="welcome-subtitle">
        Безопасные сообщения.<br />Регистрация по имени и уникальному ID.
      </p>

      <div className="welcome-features">
        <div className="feature">
          <span className="feature-icon">🔐</span>
          <span>Шифрование AES-256</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🆔</span>
          <span>Уникальный ID вместо номера</span>
        </div>
        <div className="feature">
          <span className="feature-icon">👥</span>
          <span>Только реальные люди</span>
        </div>
      </div>

      <button className="apple-btn" onClick={onRegister}>Создать аккаунт</button>
      <button className="apple-btn secondary" onClick={onLogin} style={{ marginTop: 12 }}>Войти</button>

      <p className="welcome-legal">
        Продолжая, вы соглашаетесь с{' '}
        <a href="/PRIVACY.md" target="_blank" rel="noreferrer">Политикой конфиденциальности</a>
      </p>
    </div>
  )
}
