export default function GoogleSignInButton({ onComplete, label }) {
  const handleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
    const redirectUri = window.location.origin + '/'
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      'client_id=' + encodeURIComponent(clientId) +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&response_type=id_token' +
      '&scope=openid%20profile%20email' +
      '&nonce=' + Math.random().toString(36).slice(2)
    window.location.href = url
  }

  return (
    <button className="apple-btn google-btn-custom" onClick={handleClick}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.64-.06-1.26-.17-1.86H9v3.52h4.84A4.2 4.2 0 0113 13.48v2.18h2.7c1.57-1.44 2.48-3.57 2.48-6.46z" fill="#4285F4"/>
        <path d="M9 18c2.24 0 4.12-.74 5.5-2l-2.7-2.18c-.75.5-1.7.8-2.8.8-2.15 0-3.96-1.45-4.6-3.4H1.6v2.24C3.06 15.98 5.88 18 9 18z" fill="#34A853"/>
        <path d="M4.4 10.78a4.84 4.84 0 010-3.08V5.46H1.6a8 8 0 000 7.18l2.8-2.18z" fill="#FBBC05"/>
        <path d="M9 3.58c1.22 0 2.3.42 3.16 1.24L14.4 2.6C13.1 1.42 11.24.64 9 .64c-3.12 0-5.94 2.02-7.4 4.82L4.4 7.7c.64-1.95 2.45-3.4 4.6-3.4z" fill="#EA4335"/>
      </svg>
      {label || 'Продолжить с Google'}
    </button>
  )
}
