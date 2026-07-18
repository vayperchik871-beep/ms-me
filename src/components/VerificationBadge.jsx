export default function VerificationBadge({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, flexShrink: 0, verticalAlign: 'middle' }}>
      <path d="M9 12l2 2 4-4" stroke="#00C7BE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#00C7BE"/>
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
