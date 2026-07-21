import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { detectLanguage } from '../i18n'
import AdminApp from './AdminApp'
import '../styles/global.css'

detectLanguage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AdminApp />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
