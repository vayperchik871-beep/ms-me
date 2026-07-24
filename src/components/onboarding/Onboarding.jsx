import { useState, useRef, useCallback } from 'react'
import WelcomeStep from './WelcomeStep'
import RegisterStep from './RegisterStep'
import LoginStep from './LoginStep'
import DeviceVerifyStep from './DeviceVerifyStep'
import '../../styles/onboarding.css'

const STEPS = ['welcome', 'register', 'login', 'verify']

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState('welcome')
  const [pendingUserId, setPendingUserId] = useState('')
  const [transition, setTransition] = useState('')
  const touchStart = useRef(null)
  const lockSwipe = useRef(false)

  const go = useCallback((next, dir) => {
    if (lockSwipe.current) return
    if (next === screen) return
    lockSwipe.current = true
    setTransition(dir === 'left' ? 'swipe-left' : 'swipe-right')
    setTimeout(() => {
      setScreen(next)
      setTransition(dir === 'left' ? 'swipe-right-enter' : 'swipe-left-enter')
      setTimeout(() => {
        setTransition('')
        lockSwipe.current = false
      }, 350)
    }, 300)
  }, [screen])

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    const idx = STEPS.indexOf(screen)
    if (Math.abs(diff) < 60) return
    if (diff > 0 && idx < STEPS.length - 1) {
      go(STEPS[idx + 1], 'left')
    } else if (diff < 0 && idx > 0) {
      go(STEPS[idx - 1], 'right')
    }
    touchStart.current = null
  }

  const handleVerify = (userId) => {
    setPendingUserId(userId)
    go('verify', 'left')
  }

  const animClass = transition || ''

  return (
    <div
      className="onboarding"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {screen !== 'welcome' && (
        <button className="onboarding-back" onClick={() => go(screen === 'verify' ? 'login' : 'welcome', 'right')} aria-label="Назад">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className={`onboarding-step ${animClass}`} key={screen}>
        {screen === 'welcome' && (
          <WelcomeStep
            onRegister={() => go('register', 'left')}
            onLogin={() => go('login', 'left')}
            onComplete={onComplete}
          />
        )}
        {screen === 'register' && (
          <RegisterStep
            onComplete={onComplete}
            onSwitchLogin={() => go('login', 'left')}
          />
        )}
        {screen === 'login' && (
          <LoginStep
            onNeedsVerify={handleVerify}
            onComplete={onComplete}
            onSwitchRegister={() => go('register', 'left')}
          />
        )}
        {screen === 'verify' && (
          <DeviceVerifyStep
            userId={pendingUserId}
            onComplete={onComplete}
            onBack={() => go('login', 'right')}
          />
        )}
      </div>

    </div>
  )
}
