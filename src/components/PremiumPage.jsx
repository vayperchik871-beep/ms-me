import { useAuth } from '../context/AuthContext'
import AiModelSelector from './AiModelSelector'
import { t } from '../i18n'

export default function PremiumPage({ onBack }) {
  const { user } = useAuth()

  return (
    <div className="tab-content">
      <div className="tab-header">
        <button className="tab-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="tab-title">Premium</h1>
      </div>

      <div className="capsule-list" style={{ marginTop: 16 }}>
        <p className="capsule-section-label">Подписка</p>
        <div className="capsule-item">
          <div className="capsule-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div className="capsule-item-text">
            <span className="capsule-item-title">{user?.premium ? 'Premium активен' : 'Нет подписки'}</span>
            <span className="capsule-item-value">
              {user?.premium
                ? `План: ${user?.subscriptionPlan || '—'} · до ${user?.subscriptionUntil ? new Date(user.subscriptionUntil).toLocaleDateString('ru-RU') : '—'}`
                : 'Подписка даёт доступ к AI Pro'}
            </span>
          </div>
        </div>
      </div>

      <div className="capsule-list">
        <p className="capsule-section-label">Модель ассистента</p>
        <AiModelSelector />
      </div>

      <div className="capsule-list">
        <p className="capsule-section-label">О Premium</p>
        <div className="capsule-item">
          <div className="capsule-item-icon">⚡</div>
          <div className="capsule-item-text">
            <span className="capsule-item-title">Lite</span>
            <span className="capsule-item-value">Бесплатно для всех</span>
          </div>
        </div>
        <div className="capsule-item">
          <div className="capsule-item-icon">⭐</div>
          <div className="capsule-item-text">
            <span className="capsule-item-title">Pro</span>
            <span className="capsule-item-value">Только с Premium. Более точные и глубокие ответы</span>
          </div>
        </div>
        <div className="capsule-item">
          <div className="capsule-item-icon">💎</div>
          <div className="capsule-item-text">
            <span className="capsule-item-title">Другие бонусы</span>
            <span className="capsule-item-value">Больше контактов, групп, размер файлов</span>
          </div>
        </div>
      </div>

      {!user?.premium && (
        <div className="capsule-list">
          <p className="capsule-section-label">Как получить?</p>
          <div className="capsule-item">
            <div className="capsule-item-text">
              <span className="capsule-item-value">Напишите администратору для оформления подписки.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
