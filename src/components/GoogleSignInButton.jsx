import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function GoogleSignInButton({ onComplete, label }) {
  const { googleLogin } = useAuth()
  const [error, setError] = useState('')

  return (
    <div className="google-wrap">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          setError('')
          const token = credentialResponse?.credential
          if (!token) {
            setError('Не удалось получить токен')
            return
          }
          try {
            const result = await googleLogin(token)
            onComplete?.(result)
          } catch (err) {
            const msg = err?.response?.data?.error || err?.message || 'Ошибка входа через Google'
            setError(msg)
          }
        }}
        onError={() => setError('Ошибка авторизации Google')}
        text={label === 'Войти через Google' ? 'signin_with' : 'continue_with'}
        ux_mode="redirect"
        shape="rectangular"
        theme="outline"
        size="large"
        width="300"
      />
      {error && <p className="google-error">{error}</p>}
    </div>
  )
}
