import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const customerId = params.get('customerId');

  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchDispatches = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    let url = `${import.meta.env.VITE_API_BASE}/dispatch?customerId=${customerId}`;
    if (dateRange.start && dateRange.end) {
      url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
    }

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Server error');
        return r.json();
      })
      .then(data => setDispatches(Array.isArray(data) ? data : []))
      .catch(() => setDispatches([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDispatches(); }, []);

  const handleNew = async () => {
    const token = localStorage.getItem('token');
    setCreating(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_BASE}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customerId }),
      });
      const data = await r.json();
      navigate(`/dispatches/${data.id}?customerId=${customerId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = dispatches.filter(d => filter === 'ALL' || d.status === filter);
  const inProgressCount = dispatches.filter(d => d.status === 'IN_PROGRESS').length;
  const completedCount = dispatches.filter(d => d.status === 'COMPLETED').length;

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
    maxWidth: '900px', margin: '0 auto', padding: '28px 20px',
  };

  const statusBadge = (status: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    background: status === 'COMPLETED' ? 'rgba(120,190,32,0.15)' : 'rgba(255,185,0,0.12)',
    color: status === 'COMPLETED' ? '#78BE20' : '#e8a800',
    border: `1px solid ${status === 'COMPLETED' ? 'rgba(120,190,32,0.3)' : 'rgba(255,185,0,0.25)'}`,
  });

  const filterBtn = (val: typeof filter): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
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

        <div style={topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', animation: 'fadeUp 0.4s ease both' }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Dispatches</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13.5px', margin: '4px 0 0' }}>Customer #{customerId} · {dispatches.length} total</p>
            </div>
            <button onClick={handleNew} disabled={creating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', border: 'none',
                background: creating ? 'rgba(120,190,32,0.5)' : 'linear-gradient(135deg,#78BE20,#5ea318)',
                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: creating ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(120,190,32,0.3)', fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
              {creating ? 'Creating...' : <><span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Dispatch</>}
            </button>
          </div>

          {/* NAGARE TIME RANGE FILTER */}
          <div style={{ 
            display: 'flex', gap: '12px', alignItems: 'center', 
            background: 'rgba(255,255,255,0.05)', padding: '16px', 
            borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeUp 0.4s ease 0.1s both'
          }}>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Nagare Time Range:</div>
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', outline: 'none' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>to</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', outline: 'none' }} />
            <button onClick={fetchDispatches} style={{ background: '#78BE20', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', marginLeft: 'auto' }}>Filter</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
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

          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', animation: 'fadeUp 0.4s ease 0.3s both' }}>
            {(['ALL', 'IN_PROGRESS', 'COMPLETED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={filterBtn(f)}>
                {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '12px' }} />
              Loading dispatches...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              No dispatches found matching your criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((d, i) => (
                <div key={d.id}
                  onClick={() => navigate(`/dispatches/${d.id}?customerId=${customerId}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: d.status === 'COMPLETED' ? 'rgba(120,190,32,0.05)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: `4px solid ${d.status === 'COMPLETED' ? '#78BE20' : '#e8a800'}`,
                    borderRadius: '12px', padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    animation: `rowIn 0.3s ease ${i * 0.03}s both`,
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(120,190,32,0.3)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.background = d.status === 'COMPLETED' ? 'rgba(120,190,32,0.05)' : 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>#{d.dispatch_number}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500 }}>{d.ref_product_code}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500 }}>{d.ref_schedule_number}</div>
                    <div style={{ color: '#78BE20', fontSize: '13px', fontWeight: 600 }}>{d.ref_supply_date}</div>
                  </div>
                  <div style={statusBadge(d.status)}>{d.status === 'COMPLETED' ? 'Completed' : 'In Progress'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
