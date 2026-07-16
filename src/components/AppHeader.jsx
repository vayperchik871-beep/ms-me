import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function AppHeader({ searchQuery, onSearchChange, onCompose }) {
  const { user } = useAuth()

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="user-pill">
          <span className="user-pill-name">{user?.name?.toUpperCase() || 'MS'}</span>
          <span className="user-pill-brand">{t('Профиль')}</span>
        </div>
        <button className="compose-btn" onClick={onCompose} aria-label={t('Новый чат')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <div className="search-box">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder={t('Поиск')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  )
}
