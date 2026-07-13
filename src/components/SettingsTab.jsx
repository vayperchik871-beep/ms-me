import { useAuth } from '../context/AuthContext'
import { getAccounts } from '../api/client'

export default function SettingsTab({ onLogout, onAddAccount }) {
  const { user, accounts, canAddAccount } = useAuth()

  const handleRemoveAccount = (userId) => {
    const accs = getAccounts().filter((a) => a.userId !== userId)
    localStorage.setItem('ms_accounts', JSON.stringify(accs))
    if (user?.userId === userId) onLogout()
    window.location.reload()
  }

  return (
    <div className="tab-content settings-tab">
      <h2 className="settings-title">Настройки</h2>

      <div className="settings-group">
        <div className="settings-item">
          <span>🔐 Шифрование</span>
          <span className="settings-value green">AES-256</span>
        </div>
        <div className="settings-item">
          <span>Уведомления</span>
          <span className="settings-value">Включены</span>
        </div>
        <div className="settings-item">
          <span>Тема</span>
          <span className="settings-value">Тёмная</span>
        </div>
      </div>

      <h3 className="section-title">Аккаунт</h3>
      <div className="settings-group">
        {canAddAccount && (
          <button className="settings-item clickable" onClick={onAddAccount}>
            <span>Добавить аккаунт</span>
            <span className="settings-value">{accounts.length}/2</span>
          </button>
        )}
        {accounts.map((a) => (
          <button key={a.userId} className="settings-item clickable danger" onClick={() => handleRemoveAccount(a.userId)}>
            <span>Удалить @{a.userId}</span>
          </button>
        ))}
      </div>

      <h3 className="section-title">О приложении</h3>
      <div className="settings-group">
        <a className="settings-item clickable" href="/PRIVACY.md" target="_blank" rel="noreferrer">
          <span>Политика конфиденциальности</span>
          <span className="settings-arrow">›</span>
        </a>
        <div className="settings-item">
          <span>Версия</span>
          <span className="settings-value">1.0.0</span>
        </div>
      </div>
    </div>
  )
}
