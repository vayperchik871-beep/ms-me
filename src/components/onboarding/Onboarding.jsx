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
      {/* Background chat bubbles */}
      <div className="bg-chat" aria-hidden="true">
        <div className="bg-bubble bg-bubble-1" style={{ width: '140px', height: '36px', top: '12%', left: '8%' }} />
        <div className="bg-bubble bg-bubble-2" style={{ width: '100px', height: '36px', top: '18%', left: '58%' }} />
        <div className="bg-bubble bg-bubble-3" style={{ width: '180px', height: '36px', top: '25%', left: '12%' }} />
        <div className="bg-bubble bg-bubble-4" style={{ width: '120px', height: '36px', top: '31%', left: '62%' }} />
        <div className="bg-bubble bg-bubble-5" style={{ width: '160px', height: '36px', top: '38%', left: '5%' }} />
        <div className="bg-bubble bg-bubble-6" style={{ width: '90px', height: '36px', top: '44%', left: '72%' }} />
        <div className="bg-bubble bg-bubble-7" style={{ width: '150px', height: '36px', top: '51%', left: '15%' }} />
        <div className="bg-bubble bg-bubble-8" style={{ width: '110px', height: '36px', top: '57%', left: '55%' }} />
        <div className="bg-bubble bg-bubble-9" style={{ width: '200px', height: '36px', top: '64%', left: '8%' }} />
        <div className="bg-bubble bg-bubble-10" style={{ width: '130px', height: '36px', top: '70%', left: '65%' }} />
        <div className="bg-bubble bg-bubble-11" style={{ width: '80px', height: '36px', top: '77%', left: '20%' }} />
        <div className="bg-bubble bg-bubble-12" style={{ width: '170px', height: '36px', top: '83%', left: '50%' }} />
        <div className="bg-bubble-avatar" style={{ top: '12%', left: '4%' }} />
        <div className="bg-bubble-avatar" style={{ top: '25%', left: '8%' }} />
        <div className="bg-bubble-avatar" style={{ top: '38%', left: '1%' }} />
        <div className="bg-bubble-avatar bg-avatar-right" style={{ top: '18%', right: '38%' }} />
        <div className="bg-bubble-avatar bg-avatar-right" style={{ top: '31%', right: '34%' }} />
        <div className="bg-bubble-avatar bg-avatar-right" style={{ top: '44%', right: '24%' }} />
      </div>

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
