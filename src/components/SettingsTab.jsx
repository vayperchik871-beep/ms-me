import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import PrivacyPolicy from './PrivacyPolicy'
import AccountScreen from './AccountScreen'
import PremiumPage from './PremiumPage'
import AdminPanel from './AdminPanel'

export default function SettingsTab({ onLogout, onAddAccount }) {
  const { user } = useAuth()
  const [screen, setScreen] = useState(null)

  if (screen === 'privacy') return <PrivacyPolicy onBack={() => setScreen(null)} />
  if (screen === 'account') return <AccountScreen onBack={() => setScreen(null)} onLogout={onLogout} onAddAccount={onAddAccount} />
  if (screen === 'premium') return <PremiumPage onBack={() => setScreen(null)} />
  if (screen === 'admin') return <AdminPanel onBack={() => setScreen(null)} />

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h1 className="tab-title">{t('Настройки')}</h1>
      </div>

      <div className="settings-user-card" onClick={() => setScreen('account')}>
        <div className="avatar" style={{ background: user?.profileColor || '#3a3a3e', width: 52, height: 52, fontSize: 20 }}>
          {user?.avatar ? <img src={user.avatar} alt="" className="avatar-img" /> : <span className="avatar-letter">{user?.name?.[0]}</span>}
        </div>
        <div className="settings-user-info">
          <span className="settings-user-name">{user?.name}</span>
          <span className="settings-user-id">@{user?.userId}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      <p className="settings-section-label">{t('Конфиденциальность')}</p>
      <div className="settings-card">
        <button className="settings-card-row clickable" onClick={() => setScreen('privacy')}>
          <div className="settings-card-left">
            <span className="settings-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
            </span>
            <span className="settings-card-label">{t('Политика конфиденциальности')}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <p className="settings-section-label">Premium</p>
      <div className="settings-card">
        <button className="settings-card-row clickable" onClick={() => setScreen('premium')}>
          <div className="settings-card-left">
            <span className="settings-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </span>
            <span className="settings-card-label">{user?.premium ? '⭐ Premium' : 'Premium'}</span>
          </div>
          <span className="settings-card-value">{user?.premium ? `AI: ${user?.aiModel === 'pro' ? 'Pro' : 'Lite'}` : 'Подробнее'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {user?.isAdmin && (
        <>
          <p className="settings-section-label">Админ</p>
          <div className="settings-card">
            <button className="settings-card-row clickable" onClick={() => setScreen('admin')}>
              <div className="settings-card-left">
                <span className="settings-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </span>
                <span className="settings-card-label">Админ-панель</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </>
      )}

      <p className="settings-section-label">{t('Аккаунт')}</p>
      <div className="settings-card">
        <button className="settings-card-row clickable" onClick={() => setScreen('account')}>
          <div className="settings-card-left">
            <span className="settings-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span className="settings-card-label">{t('Профиль')}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div className="settings-card-divider" />
        <button className="settings-card-row clickable" onClick={() => setScreen('account')}>
          <div className="settings-card-left">
            <span className="settings-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </span>
            <span className="settings-card-label">{t('Мои аккаунты')}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div className="settings-card-divider" />
        <button className="settings-card-row clickable" onClick={onLogout}>
          <div className="settings-card-left">
            <span className="settings-card-icon" style={{ color: '#ff453a' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span className="settings-card-label" style={{ color: '#ff453a' }}>{t('Выйти из аккаунта')}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}
