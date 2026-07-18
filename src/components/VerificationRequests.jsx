import { useState, useEffect } from 'react'
import { api, resolveMediaUrl } from '../api/client'
import { t } from '../i18n'

export default function VerificationRequests({ onClose }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getVerifyRequests()
      setRequests(data.requests || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    try {
      await api.approveVerify(id)
      load()
    } catch {}
  }

  const handleReject = async (id) => {
    try {
      await api.rejectVerify(id)
      load()
    } catch {}
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="verify-modal-overlay" onClick={onClose}>
      <div className="verify-modal verify-requests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="verify-modal-header">
          <h2>{t('Заявки на верификацию')}</h2>
          <button className="verify-close-sm" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {loading ? (
          <p className="verify-empty">{t('Загрузка...')}</p>
        ) : requests.length === 0 ? (
          <p className="verify-empty">{t('Нет заявок')}</p>
        ) : (
          <div className="verify-requests-list">
            {requests.map((r) => (
              <div key={r.id} className="verify-request-item">
                <div className="verify-request-user">
                  {r.user_avatar ? (
                    <img src={resolveMediaUrl(r.user_avatar)} alt="" className="verify-request-avatar" />
                  ) : (
                    <div className="verify-request-avatar-placeholder">{r.user_name?.[0] || '?'}</div>
                  )}
                  <div>
                    <div className="verify-request-name">{r.user_name} <span className="verify-request-handle">@{r.user_handle}</span></div>
                    <div className="verify-request-date">{formatTime(r.created_at)}</div>
                  </div>
                </div>
                {r.message && <p className="verify-request-msg">"{r.message}"</p>}
                <div className="verify-request-status">
                  {r.status === 'pending' ? (
                    <div className="verify-request-actions">
                      <button className="verify-btn-approve" onClick={() => handleApprove(r.id)}>{t('Одобрить')}</button>
                      <button className="verify-btn-reject" onClick={() => handleReject(r.id)}>{t('Отклонить')}</button>
                    </div>
                  ) : (
                    <span className={`verify-status-badge ${r.status}`}>{r.status === 'approved' ? t('Одобрено') : t('Отклонено')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
