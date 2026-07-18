import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getAccounts } from '../api/client'
import { t, setLanguage, getLanguage, getLanguages } from '../i18n'
import AdminPanel from './AdminPanel'

export default function SettingsTab({ onLogout, onAddAccount }) {
  const { user, accounts, canAddAccount } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showAdmin, setShowAdmin] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const currentLang = getLanguage()

  const handleRemoveAccount = (userId) => {
    const accs = getAccounts().filter((a) => a.userId !== userId)
    localStorage.setItem('ms_accounts', JSON.stringify(accs))
    if (user?.userId === userId) onLogout()
    window.location.reload()
  }

  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />
  }

  return (
    <div className="tab-content settings-tab">
      <h2 className="settings-title">{t('Настройки')}</h2>

      <div className="settings-group">
        <div className="settings-item">
          <span>🔐 {t('Шифрование')}</span>
          <span className="settings-value green">AES-256</span>
        </div>
        <div className="settings-item">
          <span>{t('Уведомления')}</span>
          <span className="settings-value">{t('Включены')}</span>
        </div>
        <button className="settings-item clickable" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <span>{t('Тема')}</span>
          <span className="settings-value">{theme === 'dark' ? t('Тёмная') : t('Светлая')}</span>
        </button>
        <button className="settings-item clickable" onClick={() => setShowLangPicker(!showLangPicker)}>
          <span>{t('Язык')}</span>
          <span className="settings-value">{getLanguages().find(l => l.code === currentLang)?.name || t('Русский')}</span>
        </button>
        {showLangPicker && (
          <div className="lang-picker">
            {getLanguages().map((l) => (
              <button
                key={l.code}
                className={`settings-item clickable ${l.code === currentLang ? 'active-acc' : ''}`}
                onClick={() => { setLanguage(l.code); window.location.reload() }}
              >
                <span>{l.name}</span>
                {l.code === currentLang && <span className="settings-arrow">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {(user?.isAdmin || user?.is_admin || import.meta.env?.VITE_ADMIN_MODE === 'true') && (
        <>
          <h3 className="section-title">{t('Администрирование')}</h3>
          <div className="settings-group">
            <button className="settings-item clickable" onClick={() => setShowAdmin(true)}>
              <span>🛡️ {t('Админ-панель')}</span>
              <span className="settings-arrow">›</span>
            </button>
          </div>
        </>
      )}

      <h3 className="section-title">{t('Аккаунт')}</h3>
      <div className="settings-group">
        {canAddAccount && (
          <button className="settings-item clickable" onClick={onAddAccount}>
            <span>{t('Добавить аккаунт')}</span>
            <span className="settings-value">{accounts.length}/2</span>
          </button>
        )}
        {accounts.map((a) => (
          <button key={a.userId} className="settings-item clickable danger" onClick={() => handleRemoveAccount(a.userId)}>
            <span>{t('Удалить')} @{a.userId}</span>
          </button>
        ))}
      </div>

      <h3 className="section-title">{t('О приложении')}</h3>
      <div className="settings-group">
        <a className="settings-item clickable" href="/PRIVACY.md" target="_blank" rel="noreferrer">
          <span>{t('Политика конфиденциальности')}</span>
          <span className="settings-arrow">›</span>
        </a>
        <div className="settings-item">
          <span>{t('Версия')}</span>
          <span className="settings-value">1.0.2</span>
        </div>
      </div>
    </div>
  )
}
