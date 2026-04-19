import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ─── Inline styles ───────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1B1B4B 0%, #12123a 60%, #0a0a26 100%)',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  // Subtle animated background grid
  gridOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(120,190,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120,190,32,0.04) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  // Glowing orb top-right
  orb: {
    position: 'absolute' as const,
    top: '-120px',
    right: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(120,190,32,0.12) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  card: {
    position: 'relative' as const,
    zIndex: 1,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '20px',
    padding: '48px 44px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
  } as React.CSSProperties,

  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  } as React.CSSProperties,

  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #78BE20 0%, #5a9218 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  logoText: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
    lineHeight: 1.1,
  } as React.CSSProperties,

  logoSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '11px',
    fontWeight: 400,
    letterSpacing: '0.8px',
    textTransform: 'uppercase' as const,
    marginTop: '2px',
  } as React.CSSProperties,

  heading: {
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  } as React.CSSProperties,

  subheading: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
    marginBottom: '32px',
  } as React.CSSProperties,

  fieldGroup: {
    marginBottom: '18px',
  } as React.CSSProperties,

  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  } as React.CSSProperties,

  inputWrap: {
    position: 'relative' as const,
  } as React.CSSProperties,

  input: (focused: boolean, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${hasError ? 'rgba(255,90,90,0.6)' : focused ? 'rgba(120,190,32,0.7)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease, background 0.2s ease',
    boxShadow: focused && !hasError ? '0 0 0 3px rgba(120,190,32,0.15)' : 'none',
  }),

  errorText: {
    color: 'rgba(255,110,110,0.9)',
    fontSize: '12px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  } as React.CSSProperties,

  btn: (loading: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px',
    marginTop: '8px',
    background: loading
      ? 'rgba(120,190,32,0.6)'
      : 'linear-gradient(135deg, #78BE20 0%, #5ea318 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    transform: loading ? 'scale(0.99)' : 'scale(1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: loading ? 'none' : '0 4px 20px rgba(120,190,32,0.3)',
  }),

  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  } as React.CSSProperties,

  // Progress bar under button
  progressBar: (loading: boolean): React.CSSProperties => ({
    height: '2px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    marginTop: '12px',
    overflow: 'hidden',
    opacity: loading ? 1 : 0,
    transition: 'opacity 0.2s ease',
  }),

  progressFill: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #78BE20, #aee860, #78BE20)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: '2px',
  } as React.CSSProperties,

  // Status pill that appears while loading
  statusPill: (loading: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(120,190,32,0.10)',
    border: '1px solid rgba(120,190,32,0.25)',
    borderRadius: '20px',
    padding: '7px 14px',
    marginTop: '14px',
    opacity: loading ? 1 : 0,
    transform: loading ? 'translateY(0)' : 'translateY(4px)',
    transition: 'all 0.25s ease',
    pointerEvents: 'none' as const,
  }),

  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#78BE20',
    animation: 'pulse 1s ease-in-out infinite',
    flexShrink: 0,
  } as React.CSSProperties,

  statusText: {
    color: 'rgba(120,190,32,0.9)',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.3px',
  } as React.CSSProperties,

  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '28px 0',
  } as React.CSSProperties,

  footer: {
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.25)',
    fontSize: '12px',
  } as React.CSSProperties,
};

// ─── Keyframe injection ───────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
`;

// ─── Warehouse SVG icon ───────────────────────────────────────────────────────
const WarehouseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.6" fill="none"/>
    <path d="M9 20V17" stroke="white" strokeWidth="1.6"/>
  </svg>
);

// ─── Loading status messages ──────────────────────────────────────────────────
const STATUS_MESSAGES = [
  'Verifying credentials…',
  'Connecting to server…',
  'Loading your workspace…',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Cycle status messages while loading
  useEffect(() => {
    if (!loading) return;
    setStatusIdx(0);
    const iv = setInterval(() => {
      setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length);
    }, 900);
    return () => clearInterval(iv);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
      localStorage.setItem('token', data.token);
      // Set axios default header so subsequent API calls are authenticated
      const axios = (await import('axios')).default;
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      const { jwtDecode } = await import('jwt-decode');
      const decoded: any = jwtDecode(data.token);
      setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
      navigate('/select-customer');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={S.page}>
        {/* Background decorations */}
        <div style={S.gridOverlay} />
        <div style={S.orb} />

        {/* Card */}
        <div style={{ ...S.card, animation: 'fadeUp 0.5s ease both' }}>

          {/* Logo */}
          <div style={S.logoRow}>
            <div style={S.logoIcon}>
              <WarehouseIcon />
            </div>
            <div>
              <div style={S.logoText}>NX Logistics</div>
              <div style={S.logoSub}>Warehouse Management</div>
            </div>
          </div>

          {/* Heading */}
          <div style={S.heading}>Welcome back</div>
          <div style={S.subheading}>Sign in to your operator account</div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="email">Email address</label>
              <div style={S.inputWrap}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={S.input(emailFocused, !!error && !email)}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="password">Password</label>
              <div style={S.inputWrap}>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  style={S.input(passFocused, !!error && !password)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={S.errorText}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="rgba(255,90,90,0.8)" strokeWidth="1.5"/>
                  <path d="M8 5V8.5" stroke="rgba(255,90,90,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.8" fill="rgba(255,90,90,0.9)"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={S.btn(loading)}
            >
              {loading ? (
                <>
                  <div style={S.spinner} />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Animated progress bar */}
            <div style={S.progressBar(loading)}>
              <div style={S.progressFill} />
            </div>

            {/* Status pill */}
            <div style={S.statusPill(loading)}>
              <div style={S.statusDot} />
              <span style={S.statusText}>{STATUS_MESSAGES[statusIdx]}</span>
            </div>

          </form>

          <div style={S.divider} />

          <div style={S.footer}>
            Nippon Express India · WMS Outbound v1.0
          </div>
        </div>
      </div>
    </>
  );
}