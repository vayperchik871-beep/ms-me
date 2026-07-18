import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import VerificationBadge from './VerificationBadge'

const advantages = [
  { icon: '✓', title: 'Подтверждённый аккаунт', desc: 'Пользователи сразу увидят, что ваш аккаунт настоящий' },
  { icon: '🛡', title: 'Защита от подделки', desc: 'Никто не сможет выдать себя за вас' },
  { icon: '⭐', title: 'Повышенное доверие', desc: 'Ваш профиль будет вызывать больше доверия' },
  { icon: '🚀', title: 'Приоритетная поддержка', desc: 'Быстрый ответ от команды MSM Messenger' },
  { icon: '💎', title: 'Эксклюзивные функции', desc: 'Ранний доступ к новым возможностям' },
]

function Particles() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h
    const particles = []

    const resize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 199, 190, ${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > w) p.dx *= -1
        if (p.y < 0 || p.y > h) p.dy *= -1
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="verify-particles" />
}

export default function VerificationDetailScreen({ onClose, onApply }) {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.getVerifyStatus().then(setStatus).catch(() => {})
  }, [])

  const isVerified = status?.verified
  const isPending = status?.request?.status === 'pending'

  return (
    <div className="verify-screen">
      <Particles />

      <button className="verify-close" onClick={onClose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <div className="verify-hero">
        <div className="verify-icon-wrap">
          <div className="verify-icon-glow" />
          <div className="verify-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#00C7BE"/>
              <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 className="verify-title">MSM Verify</h1>
        <p className="verify-desc">
          {isVerified
            ? t('Ваш аккаунт подтверждён')
            : t('Подтвердите свой аккаунт и получите значок верификации')}
        </p>

        {isVerified && (
          <div className="verify-badge-row">
            <VerificationBadge size={20} />
            <span>{t('Верифицирован')}</span>
          </div>
        )}
      </div>

      <div className="verify-advantages">
        <h2 className="verify-section-title">{t('Преимущества')}</h2>
        {advantages.map((a, i) => (
          <div key={i} className="verify-card">
            <div className="verify-card-icon">{a.icon}</div>
            <div className="verify-card-text">
              <h3>{t(a.title)}</h3>
              <p>{t(a.desc)}</p>
            </div>
          </div>
        ))}
      </div>

      {!isVerified && (
        <button
          className="verify-cta"
          disabled={isPending}
          onClick={() => isPending ? null : onApply()}
        >
          {isPending ? t('Заявка на рассмотрении') : t('Получить MSM Verify')}
        </button>
      )}
    </div>
  )
}
