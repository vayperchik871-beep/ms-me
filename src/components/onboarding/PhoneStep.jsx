import { useState, useRef, useEffect } from 'react'
import { t } from '../../i18n'

export default function PhoneStep({ onNext, onBack }) {
  const [part1, setPart1] = useState('777')
  const [part2, setPart2] = useState('')
  const [part3, setPart3] = useState('')
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)

  const fullPhone = `+${part1}${part2}${part3}`
  const isValid = part1.length === 3 && (part2.length + part3.length) >= 4

  useEffect(() => { ref1.current?.focus() }, [])

  const handleP1 = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 3)
    setPart1(d)
    if (d.length === 3) ref2.current?.focus()
  }

  const handleP2 = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 4)
    setPart2(d)
    if (d.length === 4) ref3.current?.focus()
  }

  const handleP3 = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 4)
    setPart3(d)
  }

  const handleKeyDown = (e, prev, setVal, val) => {
    if (e.key === 'Backspace' && val === '' && prev) {
      prev()
    }
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
              className="nw-phone-input"
              maxLength={3}
            />
          </div>
          <div className="nw-phone-seg">
            <input
              ref={ref2}
              type="tel"
              inputMode="numeric"
              value={part2}
              onChange={(e) => handleP2(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, () => ref1.current?.focus(), setPart2, part2)}
              placeholder="XXXX"
              className="nw-phone-input"
              maxLength={4}
            />
          </div>
          <div className="nw-phone-seg">
            <input
              ref={ref3}
              type="tel"
              inputMode="numeric"
              value={part3}
              onChange={(e) => handleP3(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, () => ref2.current?.focus(), setPart3, part3)}
              placeholder="XXXX"
              className="nw-phone-input"
              maxLength={4}
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
