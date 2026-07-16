import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, resolveMediaUrl } from '../api/client'
import GiftShop from './GiftShop'

export default function ProfileTab() {
  const { user, accounts, switchToAccount, refreshUser } = useAuth()
  const fileInputRef = useRef(null)
  const [gifts, setGifts] = useState([])
  const [showGiftShop, setShowGiftShop] = useState(false)
  const [showGiftList, setShowGiftList] = useState(false)

  useEffect(() => {
    if (user?.userId) {
      api.getUserGifts(user.userId).then((d) => setGifts(d.gifts)).catch(() => {})
    }
  }, [user?.userId])

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
            <img src={resolveMediaUrl(user.avatar)} alt="" className="avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = user.name?.[0] || '?' }} />
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

      {gifts.length > 0 && (
        <>
          <h3 className="section-title">Подарки ({gifts.length})</h3>
          <div className="gifts-row">
            {gifts.slice(0, showGiftList ? gifts.length : 8).map((g) => (
              <div key={g.id} className="gift-item" title={g.gift.title + (g.sender ? ` от ${g.sender.name}` : '')}>
                <span className="gift-emoji">{g.gift.emoji}</span>
              </div>
            ))}
            {gifts.length > 8 && !showGiftList && (
              <button className="gift-item gift-more" onClick={() => setShowGiftList(true)}>+{gifts.length - 8}</button>
            )}
          </div>
        </>
      )}

      <div className="settings-group" style={{ marginTop: 12 }}>
        <button className="settings-item clickable" onClick={() => setShowGiftShop(true)}>
          <span>🎁 Отправить подарок</span>
          <span className="settings-arrow">›</span>
        </button>
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

      {showGiftShop && <GiftShop onClose={() => setShowGiftShop(false)} />}
    </div>
  )
}
