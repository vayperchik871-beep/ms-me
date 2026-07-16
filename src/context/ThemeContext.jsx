import { createContext, useContext, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    if (Capacitor.isNativePlatform()) {
      if (theme === 'light') {
        StatusBar.setStyle({ style: 'LIGHT' })
        StatusBar.setBackgroundColor({ color: '#ffffff' })
      } else {
        StatusBar.setStyle({ style: 'DARK' })
        StatusBar.setBackgroundColor({ color: '#1a1d23' })
      }
    }
  }, [theme])

  const setTheme = (t) => setThemeState(t)
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
