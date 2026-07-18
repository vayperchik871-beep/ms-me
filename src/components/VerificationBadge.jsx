export default function VerificationBadge({ size = 16, type = 'msm' }) {
  if (type === 'dev') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, flexShrink: 0, verticalAlign: 'middle' }}>
        <circle cx="12" cy="8" r="4" stroke="#8E8E93" strokeWidth="1.8" fill="none"/>
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="#8E8E93" strokeWidth="1.8" fill="none"/>
        <path d="M16 6l2 2 4-4" stroke="#8E8E93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, flexShrink: 0, verticalAlign: 'middle' }}>
      <path d="M9 12l2 2 4-4" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#3B82F6"/>
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="url(#vg)" opacity="0.4"/>
      <defs>
        <linearGradient id="vg" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff"/>
          <stop offset="1" stopColor="transparent"/>
        </linearGradient>
      </defs>
    </svg>
  )
}