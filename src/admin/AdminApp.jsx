import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import Onboarding from '../components/onboarding/Onboarding'
import { useAuth } from '../context/AuthContext'

export default function AdminApp() {
  const { user, loading, refreshUser } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(!user)
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState([])
  const terminalRef = useRef(null)

  useEffect(() => {
    if (user) setShowOnboarding(false)
  }, [user])

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [history])

  const runCommand = async () => {
    const input = cmd.trim()
    if (!input) return
    setHistory((h) => [...h, { type: 'input', text: `> ${input}` }])
    setCmd('')
    if (input.toLowerCase() === 'clear') {
      setHistory([])
      return
    }
    try {
      const res = await api.adminCommand(input)
      setHistory((h) => [...h, { type: 'output', text: res.output }])
    } catch (e) {
      setHistory((h) => [...h, { type: 'error', text: `Ошибка: ${e.message}` }])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') runCommand()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="MS" className="loading-logo" />
      </div>
    )
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => { setShowOnboarding(false); refreshUser() }} />
  }

  return (
    <div className="admin-terminal-app">
      <div className="admin-terminal-app-header">
        <span className="admin-badge">ADMIN</span>
        <span className="admin-app-title">Терминал администратора</span>
        <span className="admin-user-name">@{user?.userId}</span>
      </div>
      <div className="admin-terminal-app-body">
        <div className="admin-terminal-output" ref={terminalRef}>
          <div className="terminal-line system">Терминал администратора. Введите help для списка команд.</div>
          {history.map((line, i) => (
            <div key={i} className={'terminal-line ' + line.type}>{line.text}</div>
          ))}
        </div>
        <div className="admin-terminal-input-row">
          <span className="terminal-prompt">&gt;</span>
          <input
            className="admin-terminal-input"
            placeholder="введите команду..."
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
