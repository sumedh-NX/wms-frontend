import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer';
import CameraScanner from '../components/CameraScanner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }
@keyframes successPop { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
@keyframes confetti { 0%{opacity:1;transform:translateY(0) rotate(0deg)} 100%{opacity:0;transform:translateY(-60px) rotate(360deg)} }
`;

type Dispatch = {
  id: number;
  dispatch_number: string;
  total_schedule_bins: number;
  smg_qty: number;
  bin_qty: number;
  status?: string;
  supply_quantity?: number;
  ref_product_code?: string;
  ref_case_pack?: number;
  ref_supply_date?: string;
  ref_schedule_sent_date?: string;
  ref_schedule_number?: string;
};

export default function DispatchScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [binInput, setBinInput] = useState('');
  const [pickInput, setPickInput] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showBin, setShowBin] = useState(true);

  const isComplete = dispatch
    ? dispatch.smg_qty === dispatch.total_schedule_bins &&
      dispatch.bin_qty === dispatch.total_schedule_bins &&
      dispatch.total_schedule_bins > 0
    : false;

  const loadDispatch = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
      setDispatch(res.data.dispatch);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDispatch(); }, [id]);

  useIdleTimer(() => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, 10 * 60 * 1000);

  const handleBinSubmit = async () => {
    if (!binInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/scan-bin`, { rawQr: binInput.trim() });
      setDispatch(res.data);
      setMessage({ type: 'success', text: 'Bin accepted' });
      setBinInput('');
      setShowBin(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Bin scan failed' });
      setBinInput('');
    }
  };

  const handlePickSubmit = async () => {
    if (!pickInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/scan-pick`, { rawQr: pickInput.trim() });
      setDispatch(res.data);
      setMessage({ type: 'success', text: 'Pick accepted' });
      setPickInput('');
      setShowBin(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Pick scan failed' });
      setPickInput('');
    }
  };

  const handleComplete = async () => {
    await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/complete`);
    loadDispatch();
  };

  const exportPDF = async () => {
    const element = document.getElementById('pdf-content')!;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dispatch_${dispatch?.dispatch_number}.pdf`);
  };

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
  };

  const topBar: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(27,27,75,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px',
  };

  const content: React.CSSProperties = {
    maxWidth: '680px', margin: '0 auto', padding: '24px 20px',
    position: 'relative', zIndex: 1,
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '20px', marginBottom: '16px',
  };

  if (loading || !dispatch) {
    return (
      <>
        <style>{KEYFRAMES}</style>
        <div style={page}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading dispatch...
          </div>
        </div>
      </>
    );
  }

  const progress = dispatch.total_schedule_bins > 0
    ? Math.round((dispatch.smg_qty / dispatch.total_schedule_bins) * 100)
    : 0;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={page}>
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(120,190,32,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,190,32,0.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />

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
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Dispatch #{dispatch.dispatch_number}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>NX Logistics · WMS Outbound</div>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
        </div>

        <div style={content}>

          {/* Dispatch info card */}
          <div style={{ ...card, animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Product Code', value: dispatch.ref_product_code ?? '—' },
                { label: 'Case Pack', value: dispatch.ref_case_pack ?? '—' },
                { label: 'Total Schedule Bins', value: dispatch.total_schedule_bins ?? '—' },
                { label: 'Schedule No', value: dispatch.ref_schedule_number ?? '—' },
                { label: 'Supply Date', value: dispatch.ref_supply_date ?? '—' },
                { label: 'Nagare Time', value: dispatch.ref_schedule_sent_date ?? '—' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{String(item.value)}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Scan Progress</span>
                <span style={{ color: '#78BE20', fontSize: '12px', fontWeight: 700 }}>{dispatch.smg_qty}/{dispatch.total_schedule_bins} bins</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#78BE20,#aee860)', borderRadius: '6px', transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>SMG Qty: <strong style={{ color: '#e8a800' }}>{dispatch.smg_qty}</strong></span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Bin Qty: <strong style={{ color: '#78BE20' }}>{dispatch.bin_qty}</strong></span>
              </div>
            </div>
          </div>

          {/* Alert message */}
          {message && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
              background: message.type === 'success' ? 'rgba(120,190,32,0.12)' : 'rgba(255,80,80,0.12)',
              border: `1px solid ${message.type === 'success' ? 'rgba(120,190,32,0.35)' : 'rgba(255,80,80,0.35)'}`,
              animation: 'fadeUp 0.3s ease both',
            }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: message.type === 'success' ? '#78BE20' : '#ff5050', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {message.type === 'success'
                  ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                }
              </div>
              <span style={{ color: message.type === 'success' ? '#78BE20' : '#ff7070', fontSize: '13px', fontWeight: 500 }}>{message.text}</span>
              <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
            </div>
          )}

          {/* SUCCESS BANNER — shown when all bins and picks are scanned */}
          {isComplete ? (
            <div style={{ animation: 'successPop 0.5s ease both' }}>
              <div style={{
                background: 'linear-gradient(135deg,rgba(120,190,32,0.18),rgba(120,190,32,0.08))',
                border: '1px solid rgba(120,190,32,0.4)',
                borderRadius: '16px', padding: '28px 24px', textAlign: 'center', marginBottom: '16px',
              }}>
                {/* Big checkmark */}
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(120,190,32,0.4)' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M6 16L13 23L26 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ color: '#78BE20', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Batch Complete!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>All bins and picks have been scanned successfully</div>

                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                  {[
                    { label: 'Schedule Bins', value: dispatch.total_schedule_bins, color: '#fff' },
                    { label: 'SMG Qty', value: dispatch.smg_qty, color: '#e8a800' },
                    { label: 'Bin Qty', value: dispatch.bin_qty, color: '#78BE20' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 10px' }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                      <div style={{ color: s.color, fontSize: '28px', fontWeight: 700, letterSpacing: '-1px' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {dispatch.status !== 'COMPLETED' && (
                    <button onClick={handleComplete}
                      style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#78BE20,#5ea318)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(120,190,32,0.3)' }}>
                      ✓ Complete Dispatch
                    </button>
                  )}
                  {dispatch.status === 'COMPLETED' && (
                    <>
                      <div style={{ color: 'rgba(120,190,32,0.8)', fontSize: '13px', fontWeight: 500, padding: '12px 0' }}>✓ Dispatch Completed</div>
                      <button onClick={exportPDF}
                        style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(120,190,32,0.4)', background: 'transparent', color: '#78BE20', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Export PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Bin scan input */}
              {showBin && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease 0.1s both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(232,168,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="#e8a800" strokeWidth="1.8"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="#e8a800" strokeWidth="1.8"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="#e8a800" strokeWidth="1.8"/>
                        <path d="M14 14h2M18 14h3M14 18v2M14 21h2M18 18h3M18 21v-1" stroke="#e8a800" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Scan Bin Label</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Step 1 of 2</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(232,168,0,0.12)', border: '1px solid rgba(232,168,0,0.25)', borderRadius: '20px', padding: '3px 10px', color: '#e8a800', fontSize: '11px', fontWeight: 600 }}>
                      {dispatch.smg_qty}/{dispatch.total_schedule_bins} scanned
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Paste / scan bin QR here..."
                      value={binInput}
                      onChange={e => setBinInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBinSubmit()}
                      style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    {binInput && (
                      <button onClick={() => setBinInput('')}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <CameraScanner onScan={txt => setBinInput(txt)} />
                </div>
              )}

              {/* Pick scan input */}
              {!showBin && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease 0.1s both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(120,190,32,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#78BE20" strokeWidth="1.8" strokeLinecap="round"/>
                        <rect x="9" y="3" width="6" height="4" rx="1" stroke="#78BE20" strokeWidth="1.8"/>
                        <path d="M9 12l2 2 4-4" stroke="#78BE20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Scan Pick-list</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Step 2 of 2</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(120,190,32,0.12)', border: '1px solid rgba(120,190,32,0.25)', borderRadius: '20px', padding: '3px 10px', color: '#78BE20', fontSize: '11px', fontWeight: 600 }}>
                      {dispatch.bin_qty}/{dispatch.total_schedule_bins} picked
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Paste / scan pick-list QR here..."
                      value={pickInput}
                      onChange={e => setPickInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePickSubmit()}
                      style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    {pickInput && (
                      <button onClick={() => setPickInput('')}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <CameraScanner onScan={txt => setPickInput(txt)} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden PDF content */}
        <div id="pdf-content" style={{ display: 'none' }}>
          <h1>Dispatch #{dispatch.dispatch_number}</h1>
          <p>Product Code: {dispatch.ref_product_code}</p>
          <p>Case Pack: {dispatch.ref_case_pack}</p>
          <p>Schedule No: {dispatch.ref_schedule_number}</p>
          <p>Supply Date: {dispatch.ref_supply_date}</p>
          <p>Nagare Time: {dispatch.ref_schedule_sent_date}</p>
          <p>Total Schedule Bins: {dispatch.total_schedule_bins}</p>
          <p>SMG Qty: {dispatch.smg_qty}</p>
          <p>Bin Qty: {dispatch.bin_qty}</p>
        </div>
      </div>
    </>
  );
}