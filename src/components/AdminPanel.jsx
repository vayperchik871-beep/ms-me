import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export default function AdminPanel({ onBack }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()])
      setStats(s)
      setUsers(u.users)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleBan = async (userId, banned) => {
    await api.adminBan(userId, !banned)
    load()
  }

  const handleScam = async (userId, scam) => {
    await api.adminScam(userId, !scam)
    load()
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

      {loading ? <p className="empty-hint">Загрузка...</p> : stats && (
        <div className="admin-stats">
          <div className="admin-stat-card"><span className="stat-num">{stats.onlineUsers}</span><span>Онлайн</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalUsers}</span><span>Аккаунтов</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.bannedUsers}</span><span>Забанено</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.scamUsers}</span><span>Скам</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalChats}</span><span>Чатов</span></div>
          <div className="admin-stat-card"><span className="stat-num">{stats.totalMessages}</span><span>Сообщений</span></div>
        </div>
      )}

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
                {u.scam ? 'Скам' : 'OK'}
              </button>
              <button
                className={`admin-btn ${u.banned ? 'active-ban' : ''}`}
                onClick={() => handleBan(u.userId, u.banned)}
              >
                {u.banned ? 'Бан' : 'Ок'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-hint">Нет пользователей</p>}
      </div>
    </div>
  )
}
