import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './api/client'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import Onboarding from './components/onboarding/Onboarding'
import BottomNav from './components/BottomNav'
import ChatsTab from './components/ChatsTab'
import ContactsTab from './components/ContactsTab'
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
  const { user, loading, logout, refreshUser } = useAuth()
  const { toggleTheme } = useTheme()
  const [tab, setTab] = useState('chats')
  const [activeChatId, setActiveChatId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const wsHandlers = useRef([])

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
    return (
      <Onboarding onComplete={() => { setShowOnboarding(false); refreshUser() }} />
    )
  }

  if (activeChatId) {
    return <ChatWindow chatId={activeChatId} onBack={handleBack} />
  }

  return (
    <div className="app mobile-app">
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
      {tab === 'profile' && <ProfileTab />}
      {tab === 'settings' && (
        <SettingsTab
          onLogout={logout}
          onAddAccount={() => setShowOnboarding(true)}
        />
      )}
      <BottomNav active={tab} onChange={setTab} onMenuAction={handleMenuAction} />
    </div>
  )
}
