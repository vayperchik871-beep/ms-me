import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const MODELS = [
  { id: 'lite', name: 'Lite', icon: '⚡', desc: 'Быстрая, всегда бесплатно' },
  { id: 'pro', name: 'Pro', icon: '⭐', desc: 'Улучшенная, только Premium' },
]

export default function AiModelSelector({ onClose }) {
  const { user, refreshUser } = useAuth()
  const [current, setCurrent] = useState(user?.aiModel || 'lite')
  const [loading, setLoading] = useState(false)

  const handleSelect = async (modelId) => {
    if (modelId === current) return
    if (modelId === 'pro' && !user?.premium) {
      alert('Модель Pro доступна только для Premium-подписчиков')
      return
    }
    setLoading(true)
    try {
      await api.request('/ai/model', { method: 'POST', body: JSON.stringify({ model: modelId }) })
      setCurrent(modelId)
      await refreshUser()
      onClose?.()
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-model-selector">
      <div className="ai-model-header">Модель ассистента</div>
      <div className="ai-model-list">
        {MODELS.map((m) => {
          const isActive = current === m.id
          const locked = m.id === 'pro' && !user?.premium
          return (
            <button key={m.id} className={`ai-model-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && handleSelect(m.id)} disabled={loading}>
              <span className="ai-model-icon">{m.icon}</span>
              <div className="ai-model-info">
                <div className="ai-model-name">{m.name}</div>
                <div className="ai-model-desc">{m.desc}</div>
              </div>
              {locked && <span className="ai-model-lock">🔒</span>}
              {isActive && <span className="ai-model-check">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
