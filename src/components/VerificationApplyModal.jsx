import { useState } from 'react'
import { api } from '../api/client'
import { t } from '../i18n'

export default function VerificationApplyModal({ onClose, onSubmitted, verifyType }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.submitVerifyRequest(message.trim(), verifyType)
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="apply-overlay">
      <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
        <button className="apply-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <h2 className="apply-title">{verifyType === 'dev' ? t('Заявка на Dev') : t('Заявка на верификацию')}</h2>
        <p className="apply-desc">
          {verifyType === 'dev'
            ? t('Расскажите, почему вы хотите получить статус разработчика.')
            : t('Расскажите, почему вы хотите получить верификацию. Администратор рассмотрит вашу заявку.')}
        </p>

        <textarea
          className="apply-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('Почему вы хотите верифицироваться?')}
          rows={4}
          maxLength={500}
        />

        <div className="apply-chars">{message.length}/500</div>

        {error && <p className="apply-error">{error}</p>}

        <div className="apply-actions">
          <button className="apply-cancel" onClick={onClose}>{t('Отмена')}</button>
          <button className="apply-send" onClick={handleSubmit} disabled={loading || !message.trim()}>
            {loading ? t('Отправка...') : t('Отправить')}
          </button>
        </div>
      </div>
    </div>
  )
}
