import { useRef, useState, useEffect } from 'react'
import { t } from '../i18n'

const TAB_MENUS = {
  chats: [
    { id: 'new-chat', label: () => t('Новый чат'), icon: '✏️' },
    { id: 'search-chats', label: () => t('Поиск'), icon: '🔍' },
  ],
  contacts: [
    { id: 'add-contact', label: () => t('Добавить'), icon: '👤' },
    { id: 'search-contacts', label: () => t('Поиск'), icon: '🔍' },
  ],
  profile: [
    { id: 'edit-profile', label: () => t('Редактировать'), icon: '✏️' },
    { id: 'share-profile', label: () => t('Поделиться'), icon: '📤' },
  ],
  settings: [
    { id: 'toggle-theme', label: () => t('Тема'), icon: '🎨' },
    { id: 'switch-lang', label: () => t('Язык'), icon: '🌐' },
  ],
}

export default function BottomNav({ active, onChange, onMenuAction }) {
  const tabs = [
    { id: 'chats', label: t('Чаты'), icon: ChatIcon },
    { id: 'contacts', label: t('Контакты'), icon: ContactsIcon },
    { id: 'profile', label: t('Профиль'), icon: ProfileIcon },
    { id: 'settings', label: t('Настройки'), icon: SettingsIcon },
  ]

  const [menu, setMenu] = useState(null)
  const [hoverIdx, setHoverIdx] = useState(-1)
  const longPressRef = useRef(null)
  const longPressActivated = useRef(false)
  const hoverIdxRef = useRef(-1)
  const pressedRectRef = useRef(null)

  const activeIndex = tabs.findIndex((t) => t.id === active)

  useEffect(() => {
    hoverIdxRef.current = hoverIdx
  }, [hoverIdx])

  useEffect(() => {
    if (!menu) return

    const handleMove = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const itemEl = el?.closest('[data-menu-idx]')
      if (itemEl) {
        setHoverIdx(parseInt(itemEl.dataset.menuIdx, 10))
      } else {
        setHoverIdx(-1)
      }
    }

    const handleEnd = () => {
      if (hoverIdxRef.current >= 0 && menu?.items[hoverIdxRef.current]) {
        onMenuAction?.(menu.tabId, menu.items[hoverIdxRef.current].id)
      }
      setMenu(null)
      setHoverIdx(-1)
    }

    document.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('pointerup', handleEnd)
    document.addEventListener('pointercancel', handleEnd)

    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleEnd)
      document.removeEventListener('pointercancel', handleEnd)
    }
  }, [menu])

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  const handlePointerDown = (e, tabId) => {
    if (tabId !== active) return
    longPressActivated.current = false
    const rect = e.currentTarget.getBoundingClientRect()
    pressedRectRef.current = rect

    longPressRef.current = setTimeout(() => {
      const items = TAB_MENUS[tabId]
      if (!items || items.length === 0) return
      longPressActivated.current = true
      setMenu({
        tabId,
        items,
        x: rect.left + rect.width / 2,
        y: rect.top - 12,
      })
      setHoverIdx(-1)
    }, 250)
  }

  const handlePointerUp = () => {
    clearLongPress()
  }

  const handlePointerCancel = () => {
    clearLongPress()
    setMenu(null)
    setHoverIdx(-1)
  }

  const handleClick = (tabId) => {
    if (longPressActivated.current) {
      longPressActivated.current = false
      return
    }
    onChange(tabId)
  }

  return (
    <nav className="bottom-nav">
      <div className="bn-glass" style={{ '--active': activeIndex }}>
        <div className="bn-indicator" />
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`bn-tab ${active === id ? 'bn-tab-active' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, id)}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClick={() => handleClick(id)}
          >
            <Icon active={active === id} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {menu && (
        <div className="bn-menu-anchor" style={{ left: menu.x, top: menu.y }}>
          <div className="bn-context-menu">
            {menu.items.map((item, i) => (
              <button
                key={item.id}
                data-menu-idx={i}
                className={`bn-menu-item ${hoverIdx === i ? 'bn-menu-item-hover' : ''}`}
              >
                <span className="bn-menu-icon">{item.icon}</span>
                <span className="bn-menu-label">{item.label()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

function ChatIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  )
}

function ContactsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
