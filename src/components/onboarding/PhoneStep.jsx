import { useState, useRef, useEffect } from 'react'
import { t } from '../../i18n'

export default function PhoneStep({ onNext, onBack }) {
  const [part1, setPart1] = useState('')
  const ref1 = useRef(null)

  const fullPhone = `+7${part1}`
  const isValid = part1.length >= 4

  useEffect(() => { ref1.current?.focus() }, [])

  const handleP1 = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 9)
    setPart1(d)
  }

  return (
    <div className="nw-step">
      <button className="nw-back" onClick={onBack}>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{t('Назад')}</span>
      </button>

      <div className="nw-step-content">
        <h1 className="nw-title">{t('Придумайте номер')}</h1>
        <p className="nw-subtitle">{t('Номер начинается на +777 и будет привязан к вашему аккаунту навсегда')}</p>

        <div className="nw-phone-segments">
          <div className="nw-phone-seg nw-phone-seg-prefix">
            <span className="nw-phone-prefix-text">+7</span>
            <input
              ref={ref1}
              type="tel"
              inputMode="numeric"
              value={part1}
              onChange={(e) => handleP1(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, null, setPart1, part1)}
              placeholder="777 00 00"
              className="nw-phone-input"
              maxLength={9}
            />
          </div>
        </div>

        <div className="nw-step-bottom">
          <button className="nw-btn-primary" disabled={!isValid} onClick={() => onNext(fullPhone)}>
            {t('Готово')}
          </button>
        </div>
      </div>
    </div>
  )
}
