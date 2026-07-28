import { useState, useRef, useCallback, useMemo } from 'react'
import { resolveMediaUrl } from '../api/client'
import { t } from '../i18n'

export default function AudioPlayer({ url, duration: propDur, waveform }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(propDur || 0)
  const audioRef = useRef(null)
  const animRef = useRef(null)

  const bars = useMemo(() =>
    waveform || Array.from({ length: 32 }, () => 0.2 + Math.random() * 0.8),
  [waveform])

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      cancelAnimationFrame(animRef.current)
    } else {
      audioRef.current.play().catch(() => {})
      const update = () => {
        if (audioRef.current) {
          const ct = audioRef.current.currentTime
          const dur = audioRef.current.duration || propDur || 0
          setCurrentTime(ct)
          setProgress(dur ? (ct / dur) * 100 : 0)
          animRef.current = requestAnimationFrame(update)
        }
      }
      animRef.current = requestAnimationFrame(update)
    }
  }, [playing, propDur])

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    if (audioRef.current) {
      audioRef.current.currentTime = pct * (audioRef.current.duration || duration)
      setProgress(pct * 100)
    }
  }

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const activeBar = Math.floor((progress / 100) * bars.length)
  const resolvedUrl = resolveMediaUrl(url)

  return (
    <div className="ap-wrap">
      <button className="ap-play" onClick={toggle} aria-label={playing ? t('Пауза') : t('Воспроизвести')}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="ap-wave" onClick={seek}>
        {bars.map((h, i) => (
          <div
            key={i}
            className={`ap-bar ${i <= activeBar ? 'ap-bar-active' : ''}`}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="ap-info">
        <span className="ap-time">{fmt(currentTime)}</span>
        {duration > 0 && <span className="ap-dur">{fmt(duration)}</span>}
      </div>
      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          preload="auto"
          onLoadedData={() => {
            if (audioRef.current && !propDur) setDuration(audioRef.current.duration)
          }}
          onEnded={() => {
            setPlaying(false)
            setProgress(0)
            setCurrentTime(0)
            cancelAnimationFrame(animRef.current)
          }}
          onError={() => setPlaying(false)}
        />
      )}
    </div>
  )
}
