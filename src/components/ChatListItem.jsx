export default function ChatListItem({ chat, isActive, onClick }) {
  return (
    <button
      className={`chat-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="avatar-wrap">
        <div
          className="avatar"
          style={{ backgroundColor: chat.color }}
        >
          {chat.avatar}
        </div>
        {chat.online && <span className="online-dot" />}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-top">
          <span className="chat-name">
            {chat.name}
            {chat.isGroup && <span className="group-badge">{chat.members}</span>}
          </span>
          <span className="chat-time">{chat.lastTime}</span>
        </div>
        <div className="chat-item-bottom">
          <span className="chat-preview">{chat.lastMessage}</span>
          {chat.unread > 0 && (
            <span className="unread-badge">{chat.unread}</span>
          )}
        </div>
      </div>
    </button>
  )
}
