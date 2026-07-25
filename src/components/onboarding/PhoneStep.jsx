import { useState, useRef, useEffect } from 'react'
import { t } from '../../i18n'

export default function PhoneStep({ onNext, onBack }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)

  const fullPhone = `+777${p1}${p2}${p3}`
  const isValid = p1.length === 3 && p2.length === 2 && p3.length === 2

  useEffect(() => { ref1.current?.focus() }, [])

  const handle = (val, max, set, next) => {
    const d = val.replace(/\D/g, '').slice(0, max)
    set(d)
    if (d.length === max && next) next.current?.focus()
  }

  const handleBack = (e, prev, val, set) => {
    if (e.key === 'Backspace' && val === '' && prev) prev.current?.focus()
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
            <span className="nw-phone-prefix-text">+777</span>
          </div>
          <div className="nw-phone-seg">
            <input
              ref={ref1}
              type="tel"
              inputMode="numeric"
              value={p1}
              onChange={(e) => handle(e.target.value, 3, setP1, ref2)}
              onKeyDown={(e) => handleBack(e, null, p1, setP1)}
              placeholder="000"
              className="nw-phone-input"
              maxLength={3}
            />
          </div>
          <div className="nw-phone-seg">
            <input
              ref={ref2}
              type="tel"
              inputMode="numeric"
              value={p2}
              onChange={(e) => handle(e.target.value, 2, setP2, ref3)}
              onKeyDown={(e) => handleBack(e, ref1, p2, setP2)}
              placeholder="00"
              className="nw-phone-input"
              maxLength={2}
            />
          </div>
          <div className="nw-phone-seg">
            <input
              ref={ref3}
              type="tel"
              inputMode="numeric"
              value={p3}
              onChange={(e) => handle(e.target.value, 2, setP3, null)}
              onKeyDown={(e) => handleBack(e, ref2, p3, setP3)}
              placeholder="00"
              className="nw-phone-input"
              maxLength={2}
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
