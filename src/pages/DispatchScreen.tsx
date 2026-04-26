import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer';
import CameraScanner from '../components/CameraScanner';
import jsPDF from 'jspdf';
import axios from 'axios';

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes successPop { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
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
  created_at: string;
};

export default function DispatchScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [binInput, setBinInput] = useState('');
  const [pickInput, setPickInput] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [completing, setCompleting] = useState(false);

  const showBin = !dispatch || dispatch.smg_qty <= dispatch.bin_qty;
  const isComplete = dispatch
    ? dispatch.smg_qty === dispatch.total_schedule_bins &&
      dispatch.bin_qty === dispatch.total_schedule_bins &&
      dispatch.total_schedule_bins > 0
    : false;

  const loadDispatch = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
      setDispatch(res.data.dispatch);
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDispatch(); }, [id]);

  useEffect(() => {
    if (isComplete && dispatch?.status !== 'COMPLETED') {
      handleComplete();
    }
  }, [isComplete]);

  useIdleTimer(() => {
    localStorage.removeItem('token');
    window.location.href = '/wms-frontend/#/login';
  }, 10 * 60 * 1000);

  const handleBinSubmit = async () => {
    if (!binInput.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/scan-bin`, { rawQr: binInput.trim() });
      setDispatch(res.data);
      setMessage({ type: 'success', text: 'Bin accepted' });
      setBinInput('');
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Pick scan failed' });
      setPickInput('');
    }
  };

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${id}/complete`);
      await loadDispatch();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  const exportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = pdf.internal.pageSize.getWidth();
    const PRIMARY_GREEN = [120, 190, 32];
    const DARK_TEXT = [40, 40, 40];
    const GRAY_TEXT = [120, 120, 120];
    const ROW_BG = [245, 247, 250];

    pdf.setFillColor(...PRIMARY_GREEN);
    pdf.rect(0, 0, W, 10, 'F');
    pdf.setFontSize(18);
    pdf.setTextColor(...DARK_TEXT);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WMS Dispatch Report', 14, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lastPickLog = logs.filter(l => l.type === 'PICKLIST').pop();
    const dispatchedAt = lastPickLog ? new Date(lastPickLog.created_at).toLocaleString('en-IN') : '—';

    const summary = [
      ['Dispatch No:', `DSP-${dispatch?.dispatch_number}`],
      ['Customer ID:', 'Nittera'],
      ['Status:', dispatch?.status || 'IN_PROGRESS'],
      ['Created By:', logs[0]?.operator_name || 'System'],
      ['Created At:', new Date(dispatch?.created_at || '').toLocaleString('en-IN')],
      ['Nagare Time:', dispatch?.ref_supply_date || '—'],
      ['Dispatched At:', dispatchedAt],
    ];

    let y = 30;
    summary.forEach(([label, val]) => {
      pdf.setTextColor(...GRAY_TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 14, y);
      pdf.setTextColor(...DARK_TEXT);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(val), 45, y);
      y += 7;
    });

    y += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DARK_TEXT);
    pdf.text('Dispatch Items', 14, y);
    
    y += 7;
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY_TEXT);
    const itemCols = [
      { l: 'Product', x: 14 }, { l: 'Sched No', x: 40 }, { l: 'S-Qty', x: 80 },
      { l: 'S-Bins', x: 100 }, { l: 'SMG', x: 115 }, { l: 'Bin', x: 125 },
      { l: 'Status', x: 135 }, { l: 'Nagare Time', x: 160 }, { l: 'Supply Date', x: 190 }
    ];
    itemCols.forEach(col => pdf.text(col.l, col.x, y));

    y += 6;
    pdf.setFillColor(...ROW_BG);
    pdf.rect(14, y-4, W-28, 8, 'F');
    pdf.setTextColor(...DARK_TEXT);
    pdf.setFont('helvetica', 'normal');
    const rowData = [
      dispatch?.ref_product_code, dispatch?.ref_schedule_number, dispatch?.supply_quantity,
      dispatch?.total_schedule_bins, dispatch?.smg_qty, dispatch?.bin_qty,
      'COMPLETE', dispatch?.ref_supply_date, dispatch?.ref_schedule_sent_date
    ];
    itemCols.forEach((col, i) => { pdf.text(String(rowData[i] || '—'), col.x, y); });

    y += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DARK_TEXT);
    pdf.text('Scan Audit Log', 14, y);
    
    y += 7;
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY_TEXT);
    const logCols = [
      { l: 'Timestamp', x: 14 }, { l: 'Type', x: 50 }, { l: 'Code', x: 80 },
      { l: 'Product', x: 120 }, { l: 'Result', x: 150 }, { l: 'Operator', x: 180 }
    ];
    logCols.forEach(col => pdf.text(col.l, col.x, y));

    y += 6;
    logs.forEach((log, index) => {
      if (index % 2 === 1) {
        pdf.setFillColor(...ROW_BG);
        pdf.rect(14, y-4, W-28, 7, 'F');
      }
      pdf.setTextColor(...DARK_TEXT);
      pdf.setFont('helvetica', 'normal');
      if (log.result === 'FAIL') pdf.setTextColor(200, 0, 0);
      else if (log.result === 'PASS') pdf.setTextColor(0, 150, 0);

      const logData = [
        new Date(log.created_at).toLocaleString('en-IN'),
        log.type,
        log.code,
        log.product_code,
        log.result,
        log.operator_name || 'Unknown'
      ];
      logCols.forEach((col, i) => { pdf.text(String(logData[i] || '—'), col.x, y); });
      pdf.setTextColor(...DARK_TEXT);
      y += 7;
      if (y > 280) { pdf.addPage(); y = 20; }
    });

    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | WMS Dispatch Portal`, 14, 290);
    pdf.text(`Page 1 of 1`, W-30, 290);
    pdf.save(`Dispatch_${dispatch?.dispatch_number}.pdf`);
  };

  const page: React.CSSProperties = {
    minHeight: '100vh', background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
  };
  const topBar: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 10, background: 'rgba(27,27,75,0.88)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px',
  };
  const content: React.CSSProperties = { maxWidth: '680px', margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 };
  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', marginBottom: '16px' };

  if (loading || !dispatch) {
    return (
      <div style={page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '12px' }} />
          Loading dispatch...
        </div>
      </div>
    );
  }

  const progress = dispatch.total_schedule_bins > 0 ? Math.round((dispatch.smg_qty / dispatch.total_schedule_bins) * 100) : 0;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={page}>
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(120,190,32,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,190,32,0.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0, 0 24 24" fill="none"><path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.8"/></svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Dispatch #{dispatch.dispatch_number}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>NX Logistics · WMS Outbound</div>
            </div>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        </div>

        <div style={content}>
          <div style={{ ...card, animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Product Code', value: dispatch.ref_product_code },
                { label: 'Case Pack', value: dispatch.ref_case_pack },
                { label: 'Total Schedule Bins', value: dispatch.total_schedule_bins },
                { label: 'Schedule No', value: dispatch.ref_schedule_number },
                { label: 'Nagare Time', value: dispatch.ref_supply_date }, 
                { label: 'Supply Date', value: dispatch.ref_schedule_sent_date }, 
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{String(item.value || '—')}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Scan Progress</span>
                <span style={{ color: '#78BE20', fontSize: '12px', fontWeight: 700 }}>{dispatch.smg_qty}/{dispatch.total_schedule_bins} bins · {progress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#78BE20,#aee860)', borderRadius: '6px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>

          {message && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: message.type === 'success' ? 'rgba(120,190,32,0.12)' : 'rgba(255,80,80,0.12)', border: `1px solid ${message.type === 'success' ? 'rgba(120,190,32,0.35)' : 'rgba(255,80,80,0.35)'}`, animation: 'fadeUp 0.3s ease both' }}>
              <span style={{ color: message.type === 'success' ? '#78BE20' : '#ff7070', fontSize: '13px', fontWeight: 500 }}>{message.text}</span>
              <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          )}

          {(isComplete || dispatch.status === 'COMPLETED') ? (
            <div style={{ animation: 'successPop 0.5s ease both' }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(120,190,32,0.18),rgba(120,190,32,0.06))', border: '1px solid rgba(120,190,32,0.4)', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg,#78BE20,#5a9218)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(120,190,32,0.45)' }}>
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none"><path d="M7 17L14 24L27 10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ color: '#78BE20', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>{completing ? 'Completing...' : 'Batch Complete!'}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '28px' }}>All bins and picks scanned successfully</div>
                <button onClick={exportPDF} style={{ padding: '12px 32px', borderRadius: '10px', border: '1px solid rgba(120,190,32,0.5)', background: 'rgba(120,190,32,0.12)', color: '#78BE20', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↓ Export PDF Report</button>
              </div>
            </div>
          ) : (
            <>
              {showBin && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease 0.1s both', border: '1px solid rgba(232,168,0,0.4)', background: 'rgba(232,168,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(232,168,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8a800' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Scan Bin Label</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Step 1 of 2 · Scan the bin label QR code</div>
                    </div>
                    <div style={{ background: 'rgba(232,168,0,0.12)', border: '1px solid rgba(232,168,0,0.25)', borderRadius: '20px', padding: '3px 12px', color: '#e8a800', fontSize: '11px', fontWeight: 600 }}>
                      {dispatch.smg_qty}/{dispatch.total_schedule_bins}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input autoFocus type="text" placeholder="Paste / scan bin QR..." value={binInput} onChange={e => setBinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBinSubmit()} style={{ flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(232,168,0,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                    <button onClick={() => setBinInput('')} style={{ padding: '0 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
                  </div>
                  <CameraScanner onScan={txt => setBinInput(txt)} />
                </div>
              )}
              {!showBin && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease 0.1s both', border: '1px solid rgba(120,190,32,0.4)', background: 'rgba(120,190,32,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(120,190,32,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78BE20' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Scan Pick-list</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Step 2 of 2 · Scan the pick-list QR code</div>
                    </div>
                    <div style={{ background: 'rgba(120,190,32,0.12)', border: '1px solid rgba(120,190,32,0.25)', borderRadius: '20px', padding: '3px 12px', color: '#78BE20', fontSize: '11px', fontWeight: 600 }}>
                      {dispatch.bin_qty}/{dispatch.total_schedule_bins}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input autoFocus type="text" placeholder="Paste / scan pick-list QR..." value={pickInput} onChange={e => setPickInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePickSubmit()} style={{ flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(120,190,32,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                    <button onClick={() => setPickInput('')} style={{ padding: '0 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
                  </div>
                  <CameraScanner onScan={txt => setPickInput(txt)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
