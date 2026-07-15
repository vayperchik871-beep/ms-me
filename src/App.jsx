import { useState, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './api/client'
import Onboarding from './components/onboarding/Onboarding'
import BottomNav from './components/BottomNav'
import ChatsTab from './components/ChatsTab'
import ContactsTab from './components/ContactsTab'
import ProfileTab from './components/ProfileTab'
import SettingsTab from './components/SettingsTab'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const { user, loading, logout, refreshUser } = useAuth()
  const [tab, setTab] = useState('chats')
  const [activeChatId, setActiveChatId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const wsHandlers = useRef([])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useWebSocket((data) => {
    wsHandlers.current.forEach((h) => h(data))
    if (data.type === 'new_message') {
      if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
        new Notification(data.message?.senderName || 'Новое сообщение', {
          body: data.message?.text || '📎',
          icon: '/logo.png',
        })
      }
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
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
