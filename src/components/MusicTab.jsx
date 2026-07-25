import { useState } from 'react'
import { t } from '../i18n'

export default function MusicTab() {
  const [tab, setTab] = useState('main')

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h1 className="tab-title">{t('Музыка')}</h1>
        <button className="tab-header-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="music-tabs">
        {[['main', 'Главная'], ['favorites', 'Избранное'], ['downloads', 'Загрузки']].map(([id, label]) => (
          <button key={id} className={`music-tab ${tab === id ? 'music-tab-active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="music-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="8" x2="17" y2="8" />
          <line x1="3" y1="12" x2="14" y2="12" />
          <line x1="3" y1="16" x2="11" y2="16" />
          <path d="M17 6v10" />
          <path d="M17 6l4-2v10" />
        </svg>
        <p>{t('Нет треков')}</p>
      </div>
    </div>
  )
}
