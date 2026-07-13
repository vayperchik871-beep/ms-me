import { useAuth } from '../context/AuthContext'

export default function ProfileTab() {
  const { user, accounts, switchToAccount } = useAuth()

  return (
    <div className="tab-content profile-tab">
      <div className="profile-header">
        <div className="profile-avatar-large">{user?.name?.[0]?.toUpperCase()}</div>
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
