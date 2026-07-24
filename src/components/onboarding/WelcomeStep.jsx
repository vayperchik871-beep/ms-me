export default function WelcomeStep({ onRegister, onLogin }) {
  return (
    <div className="welcome-step">
      <div className="welcome-logo-wrap">
        <img src="/logo.png" alt="MS Messenger" className="welcome-logo" />
      </div>
      <h1 className="welcome-title">MS Messenger</h1>

      <button className="apple-btn" onClick={onRegister}>Регистрация</button>
      <button className="apple-btn secondary" onClick={onLogin} style={{ marginTop: 12 }}>Вход</button>
    </div>
  )
}
