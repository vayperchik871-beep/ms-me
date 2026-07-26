import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { parseEmoji, emojiToImg } from '../utils/emoji'
import { resolveMediaUrl } from '../api/client'
import { t } from '../i18n'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const h = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return h
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return t('вчера') + ' ' + h
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')} ${h}`
}

function VoiceMessage({ url, duration }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [bars] = useState(() => Array.from({ length: 28 }, () => 0.15 + Math.random() * 0.85))
  const audioRef = useRef(null)

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }, [playing])

  const activeBar = Math.floor((progress / 100) * bars.length)
  const resolvedUrl = resolveMediaUrl(url)

  return (
    <div className="voice-msg" onClick={(e) => { e.stopPropagation(); toggle() }}>
      <button className={`voice-play-btn ${playing ? 'paused' : ''}`} aria-label={playing ? t('Пауза') : t('Воспроизвести')}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <div className={`voice-wave ${playing ? 'voice-wave-anim' : ''}`}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="voice-bar"
            style={{
              height: `${h * 100}%`,
              '--bar-delay': `${i * 0.03}s`,
              background: i <= activeBar ? 'var(--ms-green)' : 'var(--text-muted)',
              opacity: i <= activeBar ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <span className="voice-dur">{duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00'}</span>
      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          preload="auto"
          onLoadedData={() => setLoaded(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0) }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
            }
          }}
          onError={(e) => console.error('Audio error:', e.target.error)}
        />
      )}
    </div>
  )
}

function VideoMessage({ url }) {
  return (
    <div className="msg-video-wrap">
      <video controls playsInline preload="metadata" className="msg-video">
        <source src={resolveMediaUrl(url)} />
      </video>
    </div>
  )
}

function FileMessage({ url, name, size }) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)
  const isVideo = ['mp4','webm','mov','avi','mkv'].includes(ext)
  const isAudio = ['mp3','wav','ogg','oga','m4a','aac','flac','opus','webm'].includes(ext)

  return (
    <a href={resolveMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="msg-file" onClick={(e) => e.stopPropagation()}>
      <div className="msg-file-icon">
        {isImage ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        ) : isVideo ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>
        ) : isAudio ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )}
      </div>
      <div className="msg-file-info">
        <span className="msg-file-name">{name || t('Файл')}</span>
        {size && <span className="msg-file-size">{size > 1048576 ? `${(size/1048576).toFixed(1)} МБ` : `${(size/1024).toFixed(0)} КБ`}</span>}
      </div>
    </a>
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

  const isSticker = attach?.type === 'sticker'
  const isImage = attach?.type === 'image'
  const isVideo = attach?.type === 'video'
  const isVoice = attach?.type === 'voice'
  const isFile = attach?.type === 'file'

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
      <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${isImage ? 'bubble-img' : ''} ${isSticker ? 'bubble-sticker' : ''}`}>
        {showName && message.senderName && (
          <span className="sender-name">{message.senderName}</span>
        )}

        {isSticker && (
          <div className="msg-sticker-wrap">
            <img src={resolveMediaUrl(attach.url)} alt="" className="msg-sticker" />
          </div>
        )}

        {isImage && !isSticker && (
          <div className="msg-image-wrap">
            <img src={resolveMediaUrl(attach.url)} alt="" className="msg-image" />
          </div>
        )}

        {isVideo && (
          <VideoMessage url={attach.url} />
        )}

        {isVoice && (
          <VoiceMessage key={message.id} url={attach.url} duration={attach.duration} />
        )}

        {isFile && (
          <FileMessage url={attach.url} name={attach.name} size={attach.size} />
        )}

        {message.text && message.text !== '📎' && (
          <p dangerouslySetInnerHTML={useMemo(() => ({ __html: parseEmoji(message.text) }), [message.text])} />
        )}

        {message.reactions?.length > 0 && (
          <div className="reactions-display">
            {message.reactions.map((r, i) => (
              <span key={i} className="reaction-chip" dangerouslySetInnerHTML={{ __html: emojiToImg(r.emoji) }} />
            ))}
          </div>
        )}
        <div className="bubble-meta">
          {message.edited && <span className="edited-tag">{t('изм.')}</span>}
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
