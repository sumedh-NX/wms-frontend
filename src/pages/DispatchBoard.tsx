import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API = import.meta.env.VITE_API_BASE;

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes rowIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function DispatchBoard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const customerId = params.get('customerId');

  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const fetchDispatches = () => {
    setLoading(true);
    fetch(`${API}/dispatches?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setDispatches)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDispatches(); }, []);

  const handleNew = async () => {
    setCreating(true);
    const r = await fetch(`${API}/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customerId }),
    });
    const data = await r.json();
    setCreating(false);
    navigate(`/dispatches/${data.id}?customerId=${customerId}`);
  };

  const filtered = dispatches.filter(d => filter === 'ALL' || d.status === filter);
  const inProgressCount = dispatches.filter(d => d.status === 'IN_PROGRESS').length;
  const completedCount = dispatches.filter(d => d.status === 'COMPLETED').length;

  // Styles
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
  };
  const grid: React.CSSProperties = {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(120,190,32,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,190,32,0.03) 1px,transparent 1px)',
    backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0,
  };
  const topBar: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(27,27,75,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px',
  };
  const content: React.CSSProperties = {
    position: 'relative', zIndex: 1,
    maxWidth: '760px', margin: '0 auto', padding: '28px 20px',
  };

  const statusBadge = (status: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    background: status === 'COMPLETED' ? 'rgba(120,190,32,0.15)' : 'rgba(255,185,0,0.12)',
    color: status === 'COMPLETED' ? '#78BE20' : '#e8a800',
    border: `1px solid ${status === 'COMPLETED' ? 'rgba(120,190,32,0.3)' : 'rgba(255,185,0,0.25)'}`,
  });

  const filterBtn = (val: typeof filter): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600, transition: 'all 0.18s',
    background: filter === val ? 'rgba(120,190,32,0.18)' : 'transparent',
    color: filter === val ? '#78BE20' : 'rgba(255,255,255,0.4)',
    border: filter === val ? '1px solid rgba(120,190,32,0.35)' : '1px solid transparent',
  });

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={page}>
        <div style={grid} />

        {/* Top bar */}
        <div style={topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>NX Logistics</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>WMS Outbound</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate('/select-customer')}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Customers
            </button>
            <button onClick={logout}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign out
            </button>
          </div>
        </div>

        <div style={content}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', animation: 'fadeUp 0.4s ease both' }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Dispatches</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13.5px', margin: '4px 0 0' }}>Customer #{customerId} · {dispatches.length} total</p>
            </div>
            <button onClick={handleNew} disabled={creating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 20px', borderRadius: '10px', border: 'none',
                background: creating ? 'rgba(120,190,32,0.5)' : 'linear-gradient(135deg,#78BE20,#5ea318)',
                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: creating ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(120,190,32,0.3)', fontFamily: 'inherit', transition: 'all 0.2s',
                flexShrink: 0,
              }}>
              {creating
                ? <><div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Creating…</>
                : <><span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Dispatch</>
              }
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px', animation: 'fadeUp 0.4s ease 0.05s both' }}>
            {[
              { label: 'Total', value: dispatches.length, color: 'rgba(255,255,255,0.08)', textColor: '#fff' },
              { label: 'In Progress', value: inProgressCount, color: 'rgba(255,185,0,0.10)', textColor: '#e8a800' },
              { label: 'Completed', value: completedCount, color: 'rgba(120,190,32,0.10)', textColor: '#78BE20' },
            ].map(s => (
              <div key={s.label} style={{ background: s.color, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ color: s.textColor, fontSize: '28px', fontWeight: 700, letterSpacing: '-1px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            {(['ALL', 'IN_PROGRESS', 'COMPLETED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={filterBtn(f)}>
                {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          {/* Dispatch list */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px 0', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading dispatches…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>📦</div>
              {filter === 'ALL' ? 'No dispatches yet. Create one to get started.' : `No ${filter.replace('_', ' ').toLowerCase()} dispatches.`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((d, i) => (
                <div key={d.id}
                  onClick={() => navigate(`/dispatches/${d.id}?customerId=${customerId}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    animation: `rowIn 0.3s ease ${i * 0.03}s both`,
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(120,190,32,0.3)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                  }}>
                  {/* Dispatch number circle */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: d.status === 'COMPLETED' ? 'rgba(120,190,32,0.15)' : 'rgba(255,185,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: d.status === 'COMPLETED' ? '#78BE20' : '#e8a800',
                    fontSize: '13px', fontWeight: 700,
                  }}>
                    #{d.dispatch_number}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>
                      Dispatch #{d.dispatch_number}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                      {formatDate(d.created_at)}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={statusBadge(d.status)}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.status === 'COMPLETED' ? '#78BE20' : '#e8a800', flexShrink: 0 }} />
                    {d.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </div>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
                    <path d="M6 4L10 8L6 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}