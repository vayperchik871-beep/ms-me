import { useState, useRef } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { t } from '../../i18n'

export default function GoogleSetupStep({ result, onComplete }) {
  const { saveAccountAndLogin } = useAuth()
  const [userId, setUserId] = useState(result.user?.userId?.replace('google_', '') || '')
  const [name, setName] = useState(result.user?.name || '')
  const [avatar, setAvatar] = useState(result.user?.avatar || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanId = userId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanId.length < 3) { setError('ID должен быть минимум 3 символа (латиница, цифры, _)'); return }
    if (!name.trim()) { setError('Введите имя'); return }

    setLoading(true)
    try {
      api.setToken(result.token)

      let avatarUrl = avatar
      if (avatarFile) {
        const upload = await api.uploadAttachment(avatarFile)
        avatarUrl = upload.url
      }

      const body = { name: name.trim(), userId: cleanId }
      if (birthday) body.birthday = new Date(birthday).getTime()
      if (gender) body.gender = gender
      if (avatarUrl && avatarUrl !== result.user?.avatar) body.avatar = avatarUrl

      await api.updateProfile(body)

      saveAccountAndLogin({ ...result.user, userId: cleanId, name: name.trim(), avatar: avatarUrl }, result.token)
      onComplete()
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-step">
      <h2 className="setup-title">Завершение регистрации</h2>
      <p className="setup-subtitle">Придумайте свой ID и заполните профиль</p>

      <form onSubmit={handleSubmit} className="setup-form">
        <div className="setup-avatar" onClick={() => fileRef.current?.click()}>
          {avatar ? (
            <img src={avatar.startsWith('data:') || avatar?.startsWith('http') ? avatar : `https://ms-messenger-server.onrender.com${avatar}`} alt="" className="setup-avatar-img" />
          ) : (
            <div className="setup-avatar-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/></svg>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
          <span className="setup-avatar-label">{t('Аватар (необязательно)')}</span>
        </div>

        <label className="setup-field">
          <span className="setup-label">@ID</span>
          <input className="setup-input" value={userId} onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())} placeholder="your_id" required />
        </label>

        <label className="setup-field">
          <span className="setup-label">{t('Имя')}</span>
          <input className="setup-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ваше имя')} required />
        </label>

        <label className="setup-field">
          <span className="setup-label">{t('День рождения (необязательно)')}</span>
          <input className="setup-input" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>

        <label className="setup-field">
          <span className="setup-label">{t('Пол (необязательно)')}</span>
          <select className="setup-input" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">{t('Не указан')}</option>
            <option value="male">{t('Мужской')}</option>
            <option value="female">{t('Женский')}</option>
            <option value="other">{t('Другой')}</option>
          </select>
        </label>

        {error && <p className="setup-error">{error}</p>}

        <button type="submit" className="apple-btn" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? t('Сохранение...') : t('Готово')}
        </button>
      </form>
    </div>
  )
}
