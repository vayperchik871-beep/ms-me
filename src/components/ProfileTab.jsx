import { useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function ProfileTab() {
  const { user, accounts, switchToAccount, refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await api.uploadAvatar(file)
      refreshUser()
    } catch {}
  }

  return (
    <div className="tab-content profile-tab">
      <div className="profile-header">
        <div className="profile-avatar-large clickable" onClick={() => fileInputRef.current?.click()}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="avatar-img" />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
          <div className="avatar-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v16M4 12h16"/></svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <h2>{user?.name}</h2>
        <p className="profile-id">@{user?.userId}</p>
      </div>

      <div className="settings-group">
        <div className="settings-item">
          <span>Имя</span>
          <span className="settings-value">{user?.name}</span>
        </div>
        <div className="settings-item">
          <span>ID</span>
          <span className="settings-value">@{user?.userId}</span>
        </div>
      </div>

      {accounts.length > 1 && (
        <>
          <h3 className="section-title">Аккаунты на устройстве</h3>
          <div className="settings-group">
            {accounts.map((a) => (
              <button
                key={a.userId}
                className={`settings-item clickable ${a.userId === user?.userId ? 'active-acc' : ''}`}
                onClick={() => switchToAccount(a.userId)}
              >
                <span>{a.name}</span>
                <span className="settings-value">@{a.userId}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
