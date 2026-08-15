import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'
import GiftPicker from './GiftPicker'
import GiftConfirm from './GiftConfirm'

export default function MCoinsPage({ onBack }) {
  const { user, refreshUser } = useAuth()
  const [showInfo, setShowInfo] = useState(false)
  const [showGifts, setShowGifts] = useState(false)
  const [selectedGift, setSelectedGift] = useState(null)

  const cardStyle = {
    background: 'var(--card-bg)',
    borderRadius: 28,
    padding: '24px 20px 16px',
    width: '100%',
    maxWidth: 340
  }

  const btnStyle = {
    flex: 1,
    background: 'linear-gradient(145deg, rgba(90,90,100,0.55), rgba(60,60,68,0.7))',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 30,
    padding: '15px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: 'var(--text-primary)',
    fontSize: 16,
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'transform 0.15s ease'
  }

  const iconStyle = (color) => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  })

  return (
    <div className="tab-content">
      <div className="tab-header">
        <button className="tab-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="tab-title">MCoins</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
        <div style={{
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #e8e8e8, #c0c0c0)',
          boxShadow: '0 0 50px rgba(200,200,200,0.25), 0 0 100px rgba(200,200,200,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          position: 'relative'
        }}>
          <div style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #f0f0f0, #d4d4d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)'
          }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke="#b0b0b0" strokeWidth="2" fill="none"/>
              <text x="28" y="36" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#888" fontFamily="serif">$</text>
            </svg>
          </div>
        </div>

        <span style={{ fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>MCoins</span>

        <div style={{ ...cardStyle, marginTop: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 38, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {user?.mcoins ?? 0}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{t('Ваш баланс')}</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle}>
              <span style={iconStyle('#30D158')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </span>
              {t('Купить')}
            </button>
            <button style={btnStyle} onClick={() => setShowGifts(true)}>
              <span style={iconStyle('#0A84FF')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
              </span>
              {t('Подарить')}
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 16, marginTop: 12, display: 'flex', gap: 10 }}>
          <button style={btnStyle}>
            <span style={iconStyle('#FF9F0A')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </span>
            {t('Промокод')}
          </button>
          <button style={btnStyle}>
            <span style={iconStyle('#BF5AF2')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
            </span>
            {t('Статистика')}
          </button>
        </div>

        <div style={{ ...cardStyle, padding: 16, marginTop: 12 }}>
          <button
            style={{ ...btnStyle, width: '100%', flex: 'none' }}
            onClick={() => setShowInfo(!showInfo)}
          >
            <span style={iconStyle('#64D2FF')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </span>
            {t('Что такое MCoinss?')}
          </button>
          {showInfo && (
            <div style={{ padding: '12px 8px 4px', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {t('MCoinss — внутренняя валюта приложения. Вы можете покупать их, дарить другим пользователям и использовать для покупок внутри приложения.')}
            </div>
          )}
        </div>
      </div>

      {showGifts && (
        <GiftPicker
          onSelect={(gift) => { setSelectedGift(gift); setShowGifts(false) }}
          onClose={() => setShowGifts(false)}
        />
      )}
      {selectedGift && (
        <GiftConfirm
          gift={selectedGift}
          recipient={null}
          onSent={() => { setSelectedGift(null); refreshUser() }}
          onClose={() => setSelectedGift(null)}
        />
      )}
    </div>
  )
}
