import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function DeviceVerifyStep({ userId, onComplete, onBack }) {
  const { verifyDevice } = useAuth()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()

    if (next.every((d) => d) && next.join('').length === 6) {
      submitCode(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const submitCode = async (code) => {
    setError('')
    setLoading(true)
    try {
      await verifyDevice(userId, code)
      onComplete()
    } catch (err) {
      setError(err.message)
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-step">
      <div className="form-step-icon">🔐</div>
      <h2 className="form-step-title">Новое устройство</h2>
      <p className="form-step-desc">
        Код отправлен в чат <strong>MS-Мессенджер</strong>
      </p>

      {error && <div className="form-error">{error}</div>}

      <div className="code-inputs">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className={`code-digit ${d ? 'filled' : ''}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
          />
        ))}
      </div>

      <p className="code-hint">Код действителен 10 минут</p>

      <button className="text-btn" onClick={onBack} style={{ marginTop: 20 }}>
        ← Назад
      </button>
    </div>
  )
}
