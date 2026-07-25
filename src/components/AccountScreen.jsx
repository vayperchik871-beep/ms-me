import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function AccountScreen({ onBack, onLogout, onAddAccount }) {
  const { canAddAccount } = useAuth()

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="screen-back" onClick={onBack}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="screen-title">{t('Аккаунт')}</h1>
      </div>

      <div className="settings-card" style={{ marginTop: 16 }}>
        {canAddAccount && (
          <>
            <button className="settings-card-row clickable" onClick={onAddAccount}>
              <div className="settings-card-left">
                <span className="settings-card-icon" style={{ color: 'var(--user-accent, #7c5cfc)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </span>
                <span className="settings-card-label" style={{ color: 'var(--user-accent, #7c5cfc)' }}>{t('Создать аккаунт')}</span>
              </div>
            </button>
            <div className="settings-card-divider" />
          </>
        )}
        <button className="settings-card-row clickable" onClick={onLogout}>
          <div className="settings-card-left">
            <span className="settings-card-icon" style={{ color: '#ff453a' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span className="settings-card-label" style={{ color: '#ff453a' }}>{t('Выйти из аккаунта')}</span>
          </div>
        </button>
      </div>
    </div>
  )
}
