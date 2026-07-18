import { useState } from 'react'
import { api } from '../api/client'
import { t } from '../i18n'

export default function VerificationApplyModal({ onClose, onSubmitted }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.submitVerifyRequest(message.trim())
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="verify-modal-overlay" onClick={onClose}>
      <div className="verify-modal" onClick={(e) => e.stopPropagation()}>
        <div className="verify-modal-header">
          <h2>{t('Заявка на верификацию')}</h2>
        </div>

        <p className="verify-modal-desc">
          {t('Расскажите, почему вы хотите получить верификацию. Администратор рассмотрит вашу заявку.')}
        </p>

        <textarea
          className="verify-modal-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('Почему вы хотите верифицироваться?')}
          rows={5}
          maxLength={500}
        />

        <div className="verify-modal-chars">
          {message.length}/500
        </div>

        {error && <p className="verify-modal-error">{error}</p>}

        <div className="verify-modal-actions">
          <button className="verify-modal-cancel" onClick={onClose}>{t('Отмена')}</button>
          <button className="verify-modal-submit" onClick={handleSubmit} disabled={loading || !message.trim()}>
            {loading ? t('Отправка...') : t('Отправить')}
          </button>
        </div>
      </div>
    </div>
  )
}
