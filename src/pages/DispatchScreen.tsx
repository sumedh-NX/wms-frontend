import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer';
import NiteraWorkflow from '../components/workflows/NiteraWorkflow';
import UsuiWorkflow from '../components/workflows/UsuiWorkflow';
import { exportNiteraPDF, exportUsuiPDF } from '../utils/pdfExport';
import axios from 'axios';

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes successPop { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
`;

export default function DispatchScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [dispatch, setDispatch]         = useState<any>(null);
  const [logs, setLogs]                 = useState<any[]>([]);
  const [bins, setBins]                 = useState<any[]>([]);
  const [picks, setPicks]               = useState<any[]>([]);
  const [parts, setParts]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [strategyCode, setStrategyCode] = useState('');
  const [message, setMessage]           = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  const isUsui      = strategyCode === 'USUI_1toMany';
  const isComplete  = dispatch?.status === 'COMPLETED';

  // ─────────────────────────────────────────────
  // Load full dispatch data (bins, picks, parts, logs)
  // ─────────────────────────────────────────────
  const loadDispatch = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
      setDispatch(res.data.dispatch);
      setLogs(res.data.logs   || []);
      setBins(res.data.bins   || []);
      setPicks(res.data.picks || []);
      setParts(res.data.parts || []);

      // Read strategy code directly from dispatch — no admin endpoint needed
      const code = res.data.dispatch?.strategy_code || '';
      setStrategyCode(code);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDispatch(); }, [id]);

  useIdleTimer(() => {
    localStorage.removeItem('token');
    window.location.href = window.location.origin + '/#/login';
  }, 10 * 60 * 1000);

  // ─────────────────────────────────────────────
  // PDF Export — always fetches fresh data first
  // ─────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!dispatch || exporting) return;
    setExporting(true);

    try {
      // Always fetch fresh data so audit logs and parts are current
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
      const freshDispatch = res.data.dispatch;
      const freshLogs     = res.data.logs   || [];
      const freshBins     = res.data.bins   || [];
      const freshPicks    = res.data.picks  || [];
      const freshParts    = res.data.parts  || [];

      if (isUsui) {
        exportUsuiPDF(freshDispatch, freshLogs, freshBins, freshParts);
      } else {
        exportNiteraPDF(freshDispatch, freshLogs, freshBins, freshPicks);
      }
    } catch (e) {
      console.error('PDF export error:', e);
      // Fallback: use cached state if fresh fetch fails
      if (isUsui) {
        exportUsuiPDF(dispatch, logs, bins, parts);
      } else {
        exportNiteraPDF(dispatch, logs, bins, picks);
      }
    } finally {
      setExporting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────
  if (loading || !dispatch) {
    return (
      <div style={{ 
        minHeight: '100vh', background: '#1B1B4B', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          <div style={{ 
            width: '20px', height: '20px', 
            border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', 
            borderRadius: '50%', animation: 'spin 0.7s linear infinite' 
          }} />
          Loading dispatch...
        </div>
      </div>
    );
  }

  const progress = dispatch.total_schedule_bins > 0 
    ? Math.round((dispatch.smg_qty / dispatch.total_schedule_bins) * 100) 
    : 0;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        {/* Grid background */}
        <div style={{ 
          position: 'fixed', inset: 0,
          backgroundImage: 'linear-gradient(rgba(120,190,32,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,190,32,0.03) 1px,transparent 1px)',
          backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0
        }} />

        {/* Top Bar */}
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 10, 
          background: 'rgba(27,27,75,0.88)', backdropFilter: 'blur(20px)', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          padding: '0 24px', display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', height: '60px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg,#78BE20,#5a9218)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 4L21 9V20H3V9Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <rect x="9" y="14" width="6" height="6" rx="1" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                Dispatch #{dispatch.dispatch_number}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {isUsui ? 'USUI · WMS Outbound' : 'Nitera · WMS Outbound'}
              </div>
            </div>
          </div>
          <button onClick={() => navigate(-1)} style={{ 
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', 
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', 
            padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit'
          }}>← Back</button>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 }}>
          
          {/* Summary Card */}
          <div style={{ 
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '14px', padding: '20px', marginBottom: '16px',
            animation: 'fadeUp 0.4s ease both'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Product Code',       value: dispatch.ref_product_code     },
                { label: 'Case Pack',           value: dispatch.ref_case_pack        },
                { label: 'Total Schedule Bins', value: dispatch.total_schedule_bins  },
                { label: 'Schedule No',         value: dispatch.ref_schedule_number  },
                { label: 'Nagare Time',         value: dispatch.ref_supply_date      },
                { label: 'Supply Date',         value: dispatch.ref_schedule_sent_date },
              ].map(item => (
                <div key={item.label} style={{ 
                  background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' 
                }}>
                  <div style={{ 
                    color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px' 
                  }}>
                    {item.label}
                  </div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    {String(item.value || '—')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Scan Progress
                </span>
                <span style={{ color: '#78BE20', fontSize: '12px', fontWeight: 700 }}>
                  {dispatch.smg_qty}/{dispatch.total_schedule_bins} bins · {progress}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${progress}%`, 
                  background: 'linear-gradient(90deg,#78BE20,#aee860)', 
                  borderRadius: '6px', transition: 'width 0.5s ease' 
                }} />
              </div>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
              background: message.type === 'success' 
                ? 'rgba(120,190,32,0.12)' 
                : 'rgba(255,80,80,0.12)',
              border: `1px solid ${message.type === 'success' 
                ? 'rgba(120,190,32,0.35)' 
                : 'rgba(255,80,80,0.35)'}`,
              animation: 'fadeUp 0.3s ease both'
            }}>
              <span style={{ 
                color: message.type === 'success' ? '#78BE20' : '#ff7070', 
                fontSize: '13px', fontWeight: 500, flex: 1
              }}>
                {message.text}
              </span>
              <button 
                onClick={() => setMessage(null)} 
                style={{ 
                  background: 'none', border: 'none', 
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px' 
                }}
              >×</button>
            </div>
          )}

          {/* Complete State */}
          {isComplete ? (
            <div style={{ animation: 'successPop 0.5s ease both' }}>
              <div style={{ 
                background: 'linear-gradient(135deg,rgba(120,190,32,0.18),rgba(120,190,32,0.06))', 
                border: '1px solid rgba(120,190,32,0.4)', borderRadius: '16px', 
                padding: '32px 24px', textAlign: 'center', marginBottom: '16px'
              }}>
                <div style={{ 
                  width: '68px', height: '68px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg,#78BE20,#5a9218)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(120,190,32,0.45)' 
                }}>
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                    <path d="M7 17L14 24L27 10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ color: '#78BE20', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                  Batch Complete!
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '28px' }}>
                  All {isUsui ? 'bins and parts' : 'bins and picks'} scanned successfully
                </div>
                <button 
                  onClick={handleExportPDF} 
                  disabled={exporting}
                  style={{ 
                    padding: '12px 32px', borderRadius: '10px', 
                    border: '1px solid rgba(120,190,32,0.5)', 
                    background: exporting ? 'rgba(255,255,255,0.05)' : 'rgba(120,190,32,0.12)', 
                    color: exporting ? 'rgba(255,255,255,0.3)' : '#78BE20', 
                    fontSize: '14px', fontWeight: 600, 
                    cursor: exporting ? 'wait' : 'pointer', 
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {exporting ? '⏳ Preparing Report...' : '↓ Export PDF Report'}
                </button>
              </div>
            </div>

          ) : (
            /* Active Scanning Workflows */
            <>
              {isUsui ? (
                <UsuiWorkflow 
                  dispatchId={id!} 
                  dispatch={dispatch} 
                  onDispatchUpdate={setDispatch} 
                  onMessage={setMessage} 
                />
              ) : (
                <NiteraWorkflow 
                  dispatchId={id!} 
                  dispatch={dispatch} 
                  onDispatchUpdate={setDispatch} 
                  onMessage={setMessage} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}