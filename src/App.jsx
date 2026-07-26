import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useWebSocket } from './hooks/useWebSocket'
import { useMediaQuery } from './hooks/useMediaQuery'
import { api } from './api/client'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import Onboarding from './components/onboarding/Onboarding'
import BottomNav from './components/BottomNav'
import ChatsTab from './components/ChatsTab'
import ContactsTab from './components/ContactsTab'
import MusicTab from './components/MusicTab'
import ProfileTab from './components/ProfileTab'
import SettingsTab from './components/SettingsTab'
import ChatWindow from './components/ChatWindow'
import { setLanguage, getLanguage } from './i18n'

let notifId = 0

async function requestNotifPermission() {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return
  }
  try {
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions()
    }
  } catch {}
}

async function showLocalNotification(title, body) {
  if (!Capacitor.isNativePlatform()) {
    if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' })
    }
    return
  }
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.createChannel({
      id: 'messages',
      name: 'Messages',
      importance: 4, // HIGH
      visibility: 1, // PUBLIC
      vibration: true,
      sound: 'default',
    })
    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: ++notifId,
        channelId: 'messages',
      }],
    })
  } catch {}
}

export default function App() {
  const { user, loading, logout, refreshUser, googleLogin, saveAccountAndLogin } = useAuth()
  const { toggleTheme } = useTheme()
  const [tab, setTab] = useState('chats')
  const [activeChatId, setActiveChatId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const wsHandlers = useRef([])
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleMenuAction = (tabId, actionId) => {
    switch (actionId) {
      case 'new-chat': case 'search-chats': setTab('chats'); break
      case 'add-contact': case 'search-contacts': setTab('contacts'); break
      case 'edit-profile': case 'share-profile': setTab('profile'); break
      case 'toggle-theme': toggleTheme(); break
      case 'switch-lang':
        setLanguage(getLanguage() === 'ru' ? 'en' : 'ru')
        window.location.reload()
        break
    }
  }

  useEffect(() => {
    requestNotifPermission()
    const hash = window.location.hash
    if (hash && hash.includes('google_token=')) {
      const params = new URLSearchParams(hash.slice(1))
      const googleToken = params.get('google_token')
      const googleUser = params.get('google_user')
      if (googleToken && googleUser) {
        try {
          const userData = JSON.parse(decodeURIComponent(googleUser))
          window.location.hash = ''
          saveAccountAndLogin(userData, googleToken)
          refreshUser()
        } catch {
          googleLogin(googleToken).then(() => {
            window.location.hash = ''
            refreshUser()
          }).catch(() => {})
        }
      }
    } else if (hash && hash.includes('google_error=')) {
      window.location.hash = ''
    }
  }, [])

  useWebSocket((data) => {
    wsHandlers.current.forEach((h) => h(data))
    if (data.type === 'new_message' && data.message?.senderId !== user?.id) {
      const senderName = data.message?.senderName || 'Новое сообщение'
      const text = data.message?.text || '📎'
      showLocalNotification(senderName, text)
    }
  })

  const registerWsHandler = useCallback((handler) => {
    wsHandlers.current.push(handler)
    return () => {
      wsHandlers.current = wsHandlers.current.filter((h) => h !== handler)
    }
  }, [])

  const handleSelectChat = (chatId) => setActiveChatId(chatId)

  const handleStartChat = async (chatId, userId) => {
    if (chatId) {
      setActiveChatId(chatId)
    } else if (userId) {
      try {
        const { chatId: id } = await api.addContact(userId)
        setActiveChatId(id)
      } catch { /* ignore */ }
    }
    setTab('chats')
  }

  const handleBack = () => setActiveChatId(null)

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="MS" className="loading-logo" />
      </div>
    )
  }

  if (!user || showOnboarding) {
    return <Onboarding onComplete={() => { setShowOnboarding(false); refreshUser() }} />
  }

  const accentColor = user?.profileColor || '#7c5cfc'

  if (isDesktop) {
    return (
      <div className="app desktop-app" style={{ '--user-accent': accentColor }}>
        <div className="desktop-panels">
          <div className="desktop-panel desktop-panel-list">
            <div className="desktop-panel-header">
              <img src="/logo.png" alt="MS" className="desktop-app-icon" />
            </div>
            {tab === 'chats' && (
              <ChatsTab
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onWsEvent={registerWsHandler}
              />
            )}
            {tab === 'contacts' && (
              <ContactsTab onStartChat={handleStartChat} />
            )}
            {tab === 'music' && <MusicTab />}
            {tab === 'settings' && (
              <SettingsTab
                onLogout={logout}
                onAddAccount={() => setShowOnboarding(true)}
              />
            )}
            <div className="desktop-bottom-nav">
              <div className="bn-glass" style={{ '--active': ['chats','contacts','music','settings'].indexOf(tab) }}>
                <div className="bn-indicator" />
                {[
                  { id: 'chats', label: 'Чаты', icon: SideChatIcon },
                  { id: 'contacts', label: 'Контакты', icon: SideContactsIcon },
                  { id: 'music', label: 'Музыка', icon: SideMusicIcon },
                  { id: 'settings', label: 'Настройки', icon: SideSettingsIcon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`bn-tab ${tab === id ? 'bn-tab-active' : ''}`}
                    onClick={() => setTab(id)}
                  >
                    <Icon active={tab === id} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="desktop-panel desktop-panel-chat">
            {activeChatId ? (
              <ChatWindow chatId={activeChatId} onBack={handleBack} />
            ) : (
              <div className="desktop-empty">
                <img src="/logo.png" alt="" className="desktop-empty-logo" />
                <p>Выберите чат</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (activeChatId) {
    return <ChatWindow chatId={activeChatId} onBack={handleBack} />
  }

  return (
    <div className="app mobile-app" style={{ '--user-accent': accentColor }}>
      {tab === 'chats' && (
        <ChatsTab
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onWsEvent={registerWsHandler}
        />
      )}
      {tab === 'contacts' && (
        <ContactsTab onStartChat={handleStartChat} />
      )}
      {tab === 'music' && <MusicTab />}
      {tab === 'settings' && (
        <SettingsTab
          onLogout={logout}
          onAddAccount={() => setShowOnboarding(true)}
        />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

function SideChatIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  )
}

function SideContactsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function SideMusicIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function SideSettingsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}


