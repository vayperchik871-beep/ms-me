import { useRef, useMemo } from 'react'
import twemoji from 'twemoji'

export default function MessageBubble({ message, isMine, showName, selected, selectMode, onLongPress, onClick }) {
  const timerRef = useRef(null)

  const handleTouchStart = (e) => {
    timerRef.current = setTimeout(() => onLongPress?.(message, e), 500)
  }

  const handleTouchEnd = () => clearTimeout(timerRef.current)
  const handleContextMenu = (e) => {
    e.preventDefault()
    onLongPress?.(message, e)
  }

  return (
    <div
      className={`message-row ${isMine ? 'mine' : 'theirs'} ${selected ? 'selected' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
      onClick={onClick}
    >
      {selectMode && (
        <div className={`select-circle ${selected ? 'checked' : ''}`}>
          {selected && '✓'}
        </div>
      )}
      <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
        {showName && message.senderName && (
          <span className="sender-name">{message.senderName}</span>
        )}
        <p dangerouslySetInnerHTML={useMemo(() => ({ __html: twemoji.parse(message.text || '', { folder: '72x72', ext: '.png' }) }), [message.text])} />
        {message.reactions?.length > 0 && (
          <div className="reactions-display">
            {message.reactions.map((r, i) => (
              <span key={i} className="reaction-chip" dangerouslySetInnerHTML={{ __html: twemoji.parse(r.emoji || '') }} />
            ))}
          </div>
        )}
        <div className="bubble-meta">
          {message.edited && <span className="edited-tag">изм.</span>}
          <span className="bubble-time">{message.time}</span>
          {isMine && (
            <svg className="status-icon read" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L7 17l-5-5" /><path d="M22 6L11 17" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
