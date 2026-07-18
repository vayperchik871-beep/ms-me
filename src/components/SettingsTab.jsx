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
    <div className="tab-content capsule-screen">
      <h2 className="capsule-page-title">{t('Настройки')}</h2>

      <div className="capsule-section">
        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Шифрование')}</span>
            <span className="capsule-item-value capsule-item-value--green">AES-256</span>
          </div>
        </div>

        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Уведомления')}</span>
            <span className="capsule-item-value">{t('Включены')}</span>
          </div>
        </div>

        <button className="capsule-item clickable" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Тема')}</span>
            <span className="capsule-item-value">{theme === 'dark' ? t('Тёмная') : t('Светлая')}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <button className="capsule-item clickable" onClick={() => setShowLangPicker(!showLangPicker)}>
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Язык')}</span>
            <span className="capsule-item-value">{getLanguages().find(l => l.code === currentLang)?.name || t('Русский')}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        {showLangPicker && (
          <div className="capsule-lang-picker">
            {getLanguages().map((l) => (
              <button
                key={l.code}
                className={`capsule-item clickable ${l.code === currentLang ? 'capsule-active' : ''}`}
                onClick={() => { setLanguage(l.code); window.location.reload() }}
              >
                <div className="capsule-item-content" style={{ paddingLeft: 52 }}>
                  <span className="capsule-item-title">{l.name}</span>
                </div>
                {l.code === currentLang && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5DDCD0" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {(user?.isAdmin || user?.is_admin || import.meta.env?.VITE_ADMIN_MODE === 'true') && (
        <>
          <p className="capsule-section-label">{t('Администрирование')}</p>
          <div className="capsule-section">
            <button className="capsule-item clickable" onClick={() => setShowAdmin(true)}>
              <div className="capsule-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="capsule-item-content">
                <span className="capsule-item-title">{t('Админ-панель')}</span>
              </div>
              <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </>
      )}

      <p className="capsule-section-label">{t('Аккаунт')}</p>
      <div className="capsule-section">
        {canAddAccount && (
          <button className="capsule-item clickable" onClick={onAddAccount}>
            <div className="capsule-item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div className="capsule-item-content">
              <span className="capsule-item-title">{t('Добавить аккаунт')}</span>
              <span className="capsule-item-value">{accounts.length}/2</span>
            </div>
            <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
        {accounts.map((a) => (
          <button key={a.userId} className="capsule-item clickable capsule-danger" onClick={() => handleRemoveAccount(a.userId)}>
            <div className="capsule-item-icon capsule-item-icon--red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div className="capsule-item-content">
              <span className="capsule-item-title">{t('Удалить')} @{a.userId}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="capsule-section-label">{t('О приложении')}</p>
      <div className="capsule-section">
        <a className="capsule-item clickable" href="/PRIVACY.md" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Политика конфиденциальности')}</span>
          </div>
          <svg className="capsule-item-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </a>

        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div className="capsule-item-content">
            <span className="capsule-item-title">{t('Версия')}</span>
            <span className="capsule-item-value">1.0.2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
