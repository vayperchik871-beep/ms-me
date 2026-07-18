import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import VerificationBadge from './VerificationBadge'

const advantages = [
  { icon: '\u2705', title: 'Пользователи начнут вам доверять' },
  { icon: '\uD83D\uDD12', title: 'Защита от подделки аккаунта' },
  { icon: '\u2B50', title: 'Эксклюзивные функции' },
  { icon: '\uD83D\uDE80', title: 'Приоритетная поддержка' },
  { icon: '\uD83D\uDC8E', title: 'Выделенный значок в профиле' },
]

export default function VerificationDetailScreen({ onClose, onApply }) {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    api.getVerifyStatus().then(setStatus).catch(() => {})
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width = canvas.offsetWidth * devicePixelRatio
    let h = canvas.height = canvas.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
    w /= devicePixelRatio; h /= devicePixelRatio

    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      a: Math.random() * 0.5 + 0.15,
      da: (Math.random() - 0.5) * 0.008,
    }))

    let anim
    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        p.a += p.da
        if (p.a > 0.65 || p.a < 0.05) p.da *= -1
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147, 197, 253, ${p.a})`
        ctx.fill()
      }
      anim = requestAnimationFrame(loop)
    }
    loop()

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      w /= devicePixelRatio; h /= devicePixelRatio
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize) }
  }, [])

  const isVerified = status?.verified
  const isPending = status?.request?.status === 'pending'

  return (
    <div className="verify-screen">
      <canvas ref={canvasRef} className="verify-particles" />
      <div className="verify-inner">
        <button className="verify-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="verify-hero">
          <div className="verify-icon-wrap">
            <div className="verify-star">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="badgeGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8"/>
                    <stop offset="50%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#2563EB"/>
                  </linearGradient>
                </defs>
                <path d="M50 4 L61 18 L78 10 L76 28 L96 28 L84 42 L100 52 L84 62 L96 78 L76 76 L78 94 L61 86 L50 100 L39 86 L22 94 L24 76 L4 78 L16 62 L0 52 L16 42 L4 28 L24 28 L22 10 L39 18 Z" fill="url(#badgeGrad)"/>
                <path d="M38 52 L47 61 L65 43" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
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
    </div>
  )
}
