import { useState } from 'react'
import WelcomeStep from './WelcomeStep'
import RegisterStep from './RegisterStep'
import LoginStep from './LoginStep'
import DeviceVerifyStep from './DeviceVerifyStep'
import '../../styles/onboarding.css'

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState('welcome')
  const [pendingUserId, setPendingUserId] = useState('')
  const [direction, setDirection] = useState('forward')

  const go = (next) => {
    setDirection('forward')
    setScreen(next)
  }

  const back = (prev) => {
    setDirection('back')
    setScreen(prev)
  }

  const animClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left'

  return (
    <div className="onboarding">
      {screen !== 'welcome' && screen !== 'verify' && (
        <button className="onboarding-back" onClick={() => back(screen === 'register' || screen === 'login' ? 'welcome' : 'login')} aria-label="Назад">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className={`onboarding-step ${animClass}`} key={screen}>
        {screen === 'welcome' && (
          <WelcomeStep
            onRegister={() => go('register')}
            onLogin={() => go('login')}
            onComplete={onComplete}
          />
        )}
        {screen === 'register' && (
          <RegisterStep
            onComplete={onComplete}
            onSwitchLogin={() => go('login')}
          />
        )}
        {screen === 'login' && (
          <LoginStep
            onNeedsVerify={(userId) => { setPendingUserId(userId); go('verify') }}
            onComplete={onComplete}
            onSwitchRegister={() => go('register')}
          />
        )}
        {screen === 'verify' && (
          <DeviceVerifyStep
            userId={pendingUserId}
            onComplete={onComplete}
            onBack={() => back('login')}
          />
        )}
      </div>
    </div>
  )
}
