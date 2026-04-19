import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API = import.meta.env.VITE_API_BASE;

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
`;

export default function CustomerSelect() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    fetch(`${API}/customers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        if (list.length === 1) setSelected(String(list[0].id));
       })
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    setContinuing(true);
    setTimeout(() => navigate(`/dispatches?customerId=${selected}`), 300);
  };

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#1B1B4B 0%,#12123a 60%,#0a0a26 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans','Segoe UI',sans-serif", position: 'relative', overflow: 'hidden',
  };
  const grid: React.CSSProperties = {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(120,190,32,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(120,190,32,0.04) 1px,transparent 1px)',
    backgroundSize: '48px 48px', pointerEvents: 'none',
  };
  const orb: React.CSSProperties = {
    position: 'absolute', bottom: '-80px', left: '-80px', width: '320px', height: '320px',
    borderRadius: '50%', background: 'radial-gradient(circle,rgba(120,190,32,0.10) 0%,transparent 70%)', pointerEvents: 'none',
  };
  const card: React.CSSProperties = {
    position: 'relative', zIndex: 1,
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '44px 40px',
    width: '100%', maxWidth: '440px', boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
    animation: 'fadeUp 0.45s ease both',
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={page}>
        <div style={grid} />
        <div style={orb} />
        <div style={card}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                  <rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.6"/>
                </svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>NX Logistics</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.9px', textTransform: 'uppercase', marginTop: '1px' }}>WMS Outbound</div>
              </div>
            </div>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              Sign out
            </button>
          </div>

          <div style={{ color: '#fff', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>Select Customer</div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '13.5px', marginBottom: '28px' }}>Choose the customer account to continue</div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '20px 0' }}>
              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading customers…
            </div>
          ) : (
            <>
              {/* Customer cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {customers.map(c => {
                  const isSelected = selected === String(c.id);
                  return (
                    <div key={c.id} onClick={() => setSelected(String(c.id))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                        border: isSelected ? '1px solid rgba(120,190,32,0.6)' : '1px solid rgba(255,255,255,0.10)',
                        background: isSelected ? 'rgba(120,190,32,0.10)' : 'rgba(255,255,255,0.04)',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 0 3px rgba(120,190,32,0.12)' : 'none',
                      }}>
                      {/* Avatar */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: isSelected ? 'rgba(120,190,32,0.25)' : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#78BE20' : 'rgba(255,255,255,0.5)',
                        fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px',
                        transition: 'all 0.2s',
                      }}>
                        {c.code?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 600, transition: 'color 0.2s' }}>{c.name}</div>
                        <div style={{ color: isSelected ? 'rgba(120,190,32,0.8)' : 'rgba(255,255,255,0.35)', fontSize: '11.5px', letterSpacing: '0.5px', marginTop: '2px', transition: 'color 0.2s' }}>{c.code}</div>
                      </div>
                      {/* Radio circle */}
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border: isSelected ? '5px solid #78BE20' : '1.5px solid rgba(255,255,255,0.25)',
                        background: 'transparent', transition: 'all 0.2s',
                      }} />
                    </div>
                  );
                })}
              </div>

              <button onClick={handleContinue} disabled={!selected || continuing}
                style={{
                  width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                  background: selected ? 'linear-gradient(135deg,#78BE20,#5ea318)' : 'rgba(255,255,255,0.08)',
                  color: selected ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: '14.5px', fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                  boxShadow: selected ? '0 4px 20px rgba(120,190,32,0.3)' : 'none',
                }}>
                {continuing ? (
                  <><div style={{ width: '17px', height: '17px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Loading dispatches…</>
                ) : (
                  <>Continue <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M9 4L13 8L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                )}
              </button>
            </>
          )}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: '11.5px' }}>
            Nippon Express India · WMS Outbound v1.0
          </div>
        </div>
      </div>
    </>
  );
}