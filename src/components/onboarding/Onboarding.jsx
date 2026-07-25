import { useState, useCallback } from 'react'
import WelcomeStep from './WelcomeStep'
import PhoneStep from './PhoneStep'
import CredentialsStep from './CredentialsStep'
import ProfileStep from './ProfileStep'
import LoginStep from './LoginStep'
import DeviceVerifyStep from './DeviceVerifyStep'
import '../../styles/onboarding.css'

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState('welcome')
  const [phone, setPhone] = useState('')
  const [creds, setCreds] = useState({ userId: '', password: '' })
  const [pendingUserId, setPendingUserId] = useState('')
  const [animClass, setAnimClass] = useState('')

  const animateTo = useCallback((next) => {
    setAnimClass('nw-exit')
    setTimeout(() => {
      setScreen(next)
      setAnimClass('nw-enter')
      setTimeout(() => setAnimClass(''), 350)
    }, 250)
  }, [])

  return (
    <div className="onboarding">
      <div className={`onboarding-step ${animClass}`} key={screen}>
        {screen === 'welcome' && (
          <WelcomeStep onStart={() => animateTo('phone')} onLogin={() => animateTo('login')} />
        )}

        {screen === 'phone' && (
          <PhoneStep
            onBack={() => animateTo('welcome')}
            onNext={(p) => { setPhone(p); animateTo('credentials') }}
          />
        )}

        {screen === 'credentials' && (
          <CredentialsStep
            phone={phone}
            onBack={() => animateTo('phone')}
            onNext={(c) => { setCreds(c); animateTo('profile') }}
          />
        )}

        {screen === 'profile' && (
          <ProfileStep
            phone={phone}
            userId={creds.userId}
            password={creds.password}
            onBack={() => animateTo('credentials')}
            onComplete={onComplete}
          />
        )}

        {screen === 'login' && (
          <LoginStep
            onComplete={onComplete}
            onNeedsVerify={(userId) => { setPendingUserId(userId); animateTo('verify') }}
            onSwitchRegister={() => animateTo('welcome')}
          />
        )}

        {screen === 'verify' && (
          <DeviceVerifyStep
            userId={pendingUserId}
            onComplete={onComplete}
            onBack={() => animateTo('login')}
          />
        )}
      </div>
    </div>
  )
}
