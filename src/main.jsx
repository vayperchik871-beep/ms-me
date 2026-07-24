import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { detectLanguage } from './i18n'
import App from './App.jsx'
import './styles/global.css'

detectLanguage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Parse emoji with Apple-style via Twemoji
function parseEmoji(root) {
  if (typeof twemoji !== 'undefined') {
    twemoji.parse(root || document.body, { base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/' })
  }
}
const observer = new MutationObserver(() => parseEmoji())
observer.observe(document.body || document.documentElement, { childList: true, subtree: true })
setTimeout(() => parseEmoji(), 500)
