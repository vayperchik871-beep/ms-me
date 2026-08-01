import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

const GENDERS = ['male', 'female', 'other']

function toDateValue(birthday) {
  if (!birthday || birthday.length !== 10 || !birthday.includes('.')) return ''
  const [d, m, y] = birthday.split('.').map(Number)
  if (!d || !m || !y) return ''
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
}

function fromDateValue(value) {
  const [y, m, d] = value.split('-').map(Number)
  if (!d || !m || !y) return ''
  return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}.${y}`
}

export default function ProfileEditor({ onClose }) {
  const { user, refreshUser } = useAuth()
  const [birthday, setBirthday] = useState(() => toDateValue(user?.birthday))
  const [gender, setGender] = useState(user?.gender || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const genderLabel = (g) => {
    if (g === 'male') return t('Мужской')
    if (g === 'female') return t('Женский')
    if (g === 'other') return t('Другой')
    return g
  }

  const handleSave = async () => {
    let value = null
    if (birthday) {
      const [y, m, d] = birthday.split('-').map(Number)
      const now = new Date()
      if (!y || !m || !d || y < 1900 || y > now.getFullYear() || m < 1 || m > 12 || d < 1 || d > 31) {
        setError(t('Введите корректную дату'))
        return
      }
      if (new Date(y, m - 1, d) > now) {
        setError(t('Дата не может быть в будущем'))
        return
      }
      value = fromDateValue(birthday)
    }
    setSaving(true)
    try {
      await api.updateProfile({ birthday: value, gender: gender || null })
      await refreshUser()
      onClose()
    } catch {
      setError(t('Не удалось сохранить'))
    }
    setSaving(false)
  }

  const maxDate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3>{t('Редактировать профиль')}</h3>

        <div style={{ padding: '16px 0' }}>
          <p className="modal-desc" style={{ marginBottom: 8 }}>{t('День рождения')}</p>
          <input
            type="date"
            className="gift-message-input"
            value={birthday}
            min="1900-01-01"
            max={maxDate()}
            onChange={(e) => { setBirthday(e.target.value); setError('') }}
            style={{ marginBottom: 16 }}
          />

          <p className="modal-desc" style={{ marginBottom: 8 }}>{t('Пол')}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {GENDERS.map((g) => (
              <button
                key={g}
                className={`apple-btn small ${gender === g ? '' : 'secondary'}`}
                onClick={() => setGender(g)}
                style={{ flex: 1, padding: '10px 8px', fontSize: 13 }}
              >
                {genderLabel(g)}
              </button>
            ))}
            {gender && (
              <button className="apple-btn small secondary" onClick={() => setGender('')} style={{ padding: '10px 8px', fontSize: 13 }}>
                ✕
              </button>
            )}
          </div>

          {error && <p className="modal-desc" style={{ color: '#FF453A', marginBottom: 12 }}>{error}</p>}

        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="apple-btn secondary" onClick={onClose} style={{ flex: 1 }}>
            {t('Назад')}
          </button>
          <button className="apple-btn" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? t('Сохранение...') : t('Сохранить')}
          </button>
        </div>
      </div>
    </div>
  )
}
