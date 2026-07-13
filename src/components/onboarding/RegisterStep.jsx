import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const STEPS = ['name', 'id', 'password']

export default function RegisterStep({ onComplete, onSwitchLogin }) {
  const { register, canAddAccount } = useAuth()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const cleanId = userId.toLowerCase().replace(/[^a-z0-9_]/g, '')
  const initial = name.trim()[0]?.toUpperCase() || '?'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!canAddAccount) {
      setError('На устройстве уже 2 аккаунта. Удалите один в настройках.')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (cleanId.length < 3) {
      setError('ID минимум 3 символа')
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), cleanId, password)
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    setError('')
    if (step === 0 && !name.trim()) {
      setError('Введите имя')
      return
    }
    if (step === 1 && cleanId.length < 3) {
      setError('ID минимум 3 символа (a-z, 0-9, _)')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <form className="form-step register-step" onSubmit={handleSubmit}>
      <div className="register-progress">
        {STEPS.map((_, i) => (
          <span key={i} className={`progress-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="register-panel slide-in-right" key="name">
          <div className="register-avatar">{initial}</div>
          <h2 className="form-step-title">Как вас зовут?</h2>
          <p className="form-step-desc">Это имя увидят другие пользователи</p>

          {error && <div className="form-error">{error}</div>}

          <div className="profile-fields single">
            <div className={`profile-field ${focused === 'name' ? 'focused' : ''}`}>
              <label>Имя</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                placeholder="Ваше имя"
                required
                maxLength={40}
              />
            </div>
          </div>

          <button type="button" className="apple-btn" onClick={nextStep} disabled={!name.trim()}>
            Продолжить
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="register-panel slide-in-right" key="id">
          <div className="id-preview-card">
            <div className="register-avatar small">{initial}</div>
            <div>
              <div className="id-preview-name">{name.trim()}</div>
              <div className="id-preview-handle">@{cleanId || 'username'}</div>
            </div>
          </div>

          <h2 className="form-step-title">Придумайте ID</h2>
          <p className="form-step-desc">По нему вас найдут — без номера телефона</p>

          {error && <div className="form-error">{error}</div>}

          <div className="profile-fields single">
            <div className={`profile-field ${focused === 'id' ? 'focused' : ''}`}>
              <label>Уникальный ID</label>
              <div className="id-input-row">
                <span className="id-prefix">@</span>
                <input
                  autoFocus
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  onFocus={() => setFocused('id')}
                  onBlur={() => setFocused('')}
                  placeholder="username"
                  required
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <p className="id-rules">Латиница, цифры и _ · от 3 до 20 символов</p>

          <div className="register-nav">
            <button type="button" className="apple-btn secondary" onClick={prevStep}>Назад</button>
            <button type="button" className="apple-btn" onClick={nextStep} disabled={cleanId.length < 3}>
              Продолжить
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="register-panel slide-in-right" key="password">
          <div className="form-step-icon">🔐</div>
          <h2 className="form-step-title">Защитите аккаунт</h2>
          <p className="form-step-desc">
            Создаём <strong>@{cleanId}</strong> для <strong>{name.trim()}</strong>
          </p>

          {error && <div className="form-error">{error}</div>}

          <div className="profile-fields">
            <div className={`profile-field ${focused === 'pass' ? 'focused' : ''}`}>
              <label>Пароль</label>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused('')}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
              />
            </div>
            <div className={`profile-field ${focused === 'confirm' ? 'focused' : ''}`}>
              <label>Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused('')}
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <div className="register-nav">
            <button type="button" className="apple-btn secondary" onClick={prevStep}>Назад</button>
            <button
              type="submit"
              className="apple-btn"
              disabled={loading || password.length < 6 || password !== confirm}
            >
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </div>
        </div>
      )}

      <p className="form-switch">
        Уже есть аккаунт? <button type="button" className="text-btn" onClick={onSwitchLogin}>Войти</button>
      </p>
    </form>
  )
}
