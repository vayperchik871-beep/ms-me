import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import VerificationBadge from './VerificationBadge'

const advantages = [
  { icon: '✓', title: 'Пользователи начнут вам доверять', desc: '' },
  { icon: '🛡', title: 'Защита от подделки аккаунта', desc: '' },
  { icon: '⭐', title: 'Эксклюзивные функции', desc: '' },
  { icon: '🚀', title: 'Приоритетная поддержка', desc: '' },
  { icon: '💎', title: 'Выделенный значок в профиле', desc: '' },
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

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 220, 210, ${p.opacity})`
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
          <div className="verify-star">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L9.19 5.63L4.64 5.96L7.86 9.22L6.82 13.73L12 11.47L17.18 13.73L16.14 9.22L19.36 5.96L14.81 5.63L12 2Z" fill="#5DDCD0" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 className="verify-title">Slim Verif</h1>
        <p className="verify-desc">
          {isVerified
            ? t('Ваш аккаунт подтверждён')
            : t('Больше возможностей и эксклюзивные функции с подпиской Slim Verif.')}
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
            <div className="verify-card-left">
              <div className="verify-card-icon">{a.icon}</div>
              <span className="verify-card-title">{t(a.title)}</span>
            </div>
            <svg className="verify-card-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        ))}
      </div>

      {!isVerified && (
        <div className="verify-cta-wrap">
          <button
            className="verify-cta"
            disabled={isPending}
            onClick={() => isPending ? null : onApply()}
          >
            {isPending ? t('Заявка на рассмотрении') : t('Применить')}
          </button>
        </div>
      )}
    </div>
  )
}
