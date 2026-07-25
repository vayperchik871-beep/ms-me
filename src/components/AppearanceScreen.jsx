import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { t } from '../i18n'

export default function AppearanceScreen({ onBack }) {
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState('navigation')
  const [tabs, setTabs] = useState({ contacts: true, music: true, calls: false })

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="screen-back" onClick={onBack}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="screen-title">{t('Оформление')}</h1>
      </div>

      <div className="appearance-tabs">
        <button className={`appearance-tab ${tab === 'navigation' ? 'appearance-tab-active' : ''}`} onClick={() => setTab('navigation')}>
          {t('Навигация')}
        </button>
        <button className={`appearance-tab ${tab === 'theme' ? 'appearance-tab-active' : ''}`} onClick={() => setTab('theme')}>
          {t('Тема')}
        </button>
      </div>

      {tab === 'navigation' && (
        <div className="settings-card" style={{ marginBottom: 16 }}>
          {[
            ['contacts', 'Контакты', <PeopleSmallIcon />, true],
            ['music', 'Музыка', <MusicSmallIcon />, true],
            ['calls', 'Звонки', <PhoneSmallIcon />, false],
          ].map(([key, label, icon, defaultOn]) => (
            <div key={key}>
              <div className="settings-card-row">
                <div className="settings-card-left">
                  <span className="settings-card-icon">{icon}</span>
                  <span className="settings-card-label">{label}</span>
                </div>
                <button className={`toggle-switch ${(tabs[key] !== undefined ? tabs[key] : defaultOn) ? 'toggle-on' : ''}`} onClick={() => setTabs({ ...tabs, [key]: !(tabs[key] !== undefined ? tabs[key] : defaultOn) })}>
                  <div className="toggle-knob" />
                </button>
              </div>
              {key !== 'calls' && <div className="settings-card-divider" />}
            </div>
          ))}
          <p className="settings-card-hint">{t('Отключите вкладки, которые не хотите видеть в панели навигации')}</p>
        </div>
      )}

      {tab === 'theme' && (
        <div className="settings-card" style={{ marginTop: 16 }}>
          <p className="settings-card-label" style={{ padding: '14px 16px 4px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{t('Режим')}</p>
          {[
            ['system', 'Системная', <SystemIcon />],
            ['dark', 'Тёмная', <MoonIcon />],
            ['light', 'Светлая', <SunIcon />],
          ].map(([key, label, icon]) => (
            <div key={key}>
              <button className="settings-card-row clickable" onClick={() => setTheme(key)}>
                <div className="settings-card-left">
                  <span className="settings-card-icon">{icon}</span>
                  <span className="settings-card-label">{label}</span>
                </div>
                {theme === key && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>
              {key !== 'light' && <div className="settings-card-divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PeopleSmallIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}
function MusicSmallIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="8" x2="17" y2="8"/><line x1="3" y1="12" x2="14" y2="12"/><line x1="3" y1="16" x2="11" y2="16"/><path d="M17 6v10"/><path d="M17 6l4-2v10"/></svg>
}
function PhoneSmallIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
}
function SystemIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
}
function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
}
function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
}
