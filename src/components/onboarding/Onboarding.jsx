import { useState } from 'react'
import WelcomeStep from './WelcomeStep'
import RegisterStep from './RegisterStep'
import LoginStep from './LoginStep'
import DeviceVerifyStep from './DeviceVerifyStep'
import GoogleSetupStep from './GoogleSetupStep'
import '../../styles/onboarding.css'

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState('welcome')
  const [pendingUserId, setPendingUserId] = useState('')
  const [googleResult, setGoogleResult] = useState(null)
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

  const handleGoogleComplete = (result) => {
    if (result?.needsSetup) {
      setGoogleResult(result)
      go('google-setup')
    } else if (result) {
      onComplete?.()
    }
  }

  return (
    <div className="onboarding">
      {screen !== 'welcome' && screen !== 'verify' && screen !== 'google-setup' && (
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
            onComplete={handleGoogleComplete}
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
        {screen === 'google-setup' && googleResult && (
          <GoogleSetupStep
            result={googleResult}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  )
}
