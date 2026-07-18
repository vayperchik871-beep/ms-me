import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import { t } from '../i18n'
import VerificationRequests from './VerificationRequests'

export default function AdminPanel({ onBack }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('stats')
  const [showVerifyReqs, setShowVerifyReqs] = useState(false)
  const terminalRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()])
      setStats(s)
      setUsers(u.users)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [history])

  const handleBan = async (userId, banned) => {
    await api.adminBan(userId, !banned)
    load()
  }

  const handleScam = async (userId, scam) => {
    await api.adminScam(userId, !scam)
    load()
  }

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

  const filtered = users.filter((u) =>
    u.userId.includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="tab-content settings-tab">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2>Админ-панель</h2>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Статистика</button>
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Пользователи</button>
        <button className={`admin-tab ${tab === 'terminal' ? 'active' : ''}`} onClick={() => setTab('terminal')}>Терминал</button>
        <button className="admin-tab" onClick={() => setShowVerifyReqs(true)}>Верификация</button>
      </div>

      {tab === 'stats' && (loading ? <p className="empty-hint">Загрузка...</p> : stats ? (
        <div className="admin-stats">
          <div className="admin-stat-card"><span className="stat-num">{stats.onlineUsers}</span><span>Онлайн</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalUsers}</span><span>Аккаунтов</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.bannedUsers}</span><span>Забанено</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.scamUsers}</span><span>Скам</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalChats}</span><span>Чатов</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalMessages}</span><span>Сообщений</span></div>
        </div>
      ) : null)}

      {tab === 'users' && (
        <>
          <h3 className="section-title">Пользователи</h3>
          <div className="search-box" style={{ margin: '0 16px 12px' }}>
            <input placeholder="Поиск по ID или имени..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="admin-users-list">
            {filtered.map((u) => (
              <div key={u.id} className="admin-user-row">
                <div className="admin-user-info">
                  <strong>{u.name}</strong>
                  <span className="settings-value">@{u.userId}</span>
                </div>
                <div className="admin-user-actions">
                  <button
                    className={`admin-btn ${u.scam ? 'active-scam' : ''}`}
                    onClick={() => handleScam(u.userId, u.scam)}
                  >
                    {u.scam ? t('Скам') : 'OK'}
                  </button>
                  <button
                    className={`admin-btn ${u.banned ? 'active-ban' : ''}`}
                    onClick={() => handleBan(u.userId, u.banned)}
                  >
                    {u.banned ? t('Бан') : t('Ок')}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="empty-hint">Нет пользователей</p>}
          </div>
        </>
      )}

      {tab === 'terminal' && (
        <div className="admin-terminal-container">
          <div className="admin-terminal-output" ref={terminalRef}>
            <div className="terminal-line system">Терминал администратора. Введите help для списка команд.</div>
            {history.map((line, i) => (
              <div key={i} className={`terminal-line ${line.type}`}>{line.text}</div>
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
      )}
    </div>
  )
}
