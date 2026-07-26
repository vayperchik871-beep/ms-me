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

  const handleBack = (e, prev) => {
    if (e.key === 'Backspace' && prev) prev.current?.focus()
  }

  return (
    <div className="nw-step">
      <button className="nw-back" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        {t('Назад')}
      </button>

      <div className="nw-step-content" style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 0 }}>
        <h1 className="nw-title" style={{ textAlign: 'center' }}>{t('Придумайте номер')}</h1>
        <p className="nw-subtitle" style={{ textAlign: 'center', margin: '0 auto 32px' }}>{t('Номер начинается на +777 и будет привязан к вашему аккаунту навсегда')}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <div className="nw-field">
            <input
              className="nw-field-input"
              style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 2, color: '#7c5cfc' }}
              value="+777"
              readOnly
            />
          </div>
          <div className="nw-field">
            <input
              ref={ref1}
              className="nw-field-input"
              type="tel"
              inputMode="numeric"
              value={p1}
              onChange={(e) => handle(e.target.value, 3, setP1, ref2)}
              onKeyDown={(e) => handleBack(e, null)}
              placeholder="000"
              maxLength={3}
              style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: 4 }}
            />
          </div>
          <div className="nw-field">
            <input
              ref={ref2}
              className="nw-field-input"
              type="tel"
              inputMode="numeric"
              value={p2}
              onChange={(e) => handle(e.target.value, 2, setP3, ref3)}
              onKeyDown={(e) => handleBack(e, ref1)}
              placeholder="00"
              maxLength={2}
              style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: 4 }}
            />
          </div>
          <div className="nw-field">
            <input
              ref={ref3}
              className="nw-field-input"
              type="tel"
              inputMode="numeric"
              value={p3}
              onChange={(e) => handle(e.target.value, 2, setP3, null)}
              onKeyDown={(e) => handleBack(e, ref2)}
              placeholder="00"
              maxLength={2}
              style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: 4 }}
            />
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 340, marginTop: 24 }}>
          <button className="nw-btn-primary" disabled={!isValid} onClick={() => onNext(fullPhone)}>
            {t('Готово')}
          </button>
        </div>
      </div>
    </div>
  )
}
