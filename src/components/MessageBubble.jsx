import { useRef, useMemo, useState, useCallback } from 'react'
import { parseEmoji } from '../utils/emoji'
import { resolveMediaUrl } from '../api/client'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const h = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return h
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'вчера ' + h
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')} ${h}`
}

function VoiceMessage({ url, duration }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [playing])

  return (
    <div className="voice-msg" onClick={(e) => { e.stopPropagation(); toggle() }}>
      <button className={`voice-play-btn ${playing ? 'paused' : ''}`} aria-label={playing ? 'Пауза' : 'Воспроизвести'}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <div className="voice-wave">
        <div className="voice-progress" style={{ width: `${progress}%` }} />
      </div>
      <span className="voice-dur">{duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00'}</span>
      <audio
        ref={audioRef}
        src={resolveMediaUrl(url)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
          }
        }}
      />
    </div>
  )
}

export default function MessageBubble({ message, isMine, showName, selected, selectMode, onLongPress, onClick }) {
  const timerRef = useRef(null)
  const attach = message.attachment

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
      <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${attach?.type === 'image' ? 'bubble-img' : ''}`}>
        {showName && message.senderName && (
          <span className="sender-name">{message.senderName}</span>
        )}

        {attach?.type === 'image' && (
          <div className="msg-image-wrap">
            <img src={resolveMediaUrl(attach.url)} alt="" className="msg-image" />
          </div>
        )}

        {attach?.type === 'voice' && (
          <VoiceMessage url={attach.url} duration={attach.duration} />
        )}

        {message.text && message.text !== '📎' && (
          <p dangerouslySetInnerHTML={useMemo(() => ({ __html: parseEmoji(message.text) }), [message.text])} />
        )}

        {message.reactions?.length > 0 && (
          <div className="reactions-display">
            {message.reactions.map((r, i) => (
              <span key={i} className="reaction-chip" dangerouslySetInnerHTML={{ __html: parseEmoji(r.emoji) }} />
            ))}
          </div>
        )}
        <div className="bubble-meta">
          {message.edited && <span className="edited-tag">изм.</span>}
          <span className="bubble-time">{formatTime(message.createdAt)}</span>
          {isMine && (
            <svg className={`status-icon ${message.read ? 'read' : ''}`} width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L7 17l-5-5" />
              {message.read && <path d="M22 6L11 17" />}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
