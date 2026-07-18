import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

const GENDERS = ['male', 'female', 'other']

export default function ProfileEditor({ onClose }) {
  const { user, refreshUser } = useAuth()
  const [birthday, setBirthday] = useState(user?.birthday || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [saving, setSaving] = useState(false)

  const genderLabel = (g) => {
    if (g === 'male') return t('Мужской')
    if (g === 'female') return t('Женский')
    if (g === 'other') return t('Другой')
    return g
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateProfile({ birthday: birthday || null, gender: gender || null })
      await refreshUser()
      onClose()
    } catch {}
    setSaving(false)
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
            onChange={(e) => setBirthday(e.target.value)}
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