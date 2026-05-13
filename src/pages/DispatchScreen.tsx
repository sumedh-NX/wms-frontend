import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdleTimer } from '../hooks/useIdleTimer';
import NiteraWorkflow from '../components/workflows/NiteraWorkflow';
import UsuiWorkflow from '../components/workflows/UsuiWorkflow';
import { exportDispatchPDF } from '../utils/pdfExport';
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
  
  const [dispatch, setDispatch] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [strategyCode, setStrategyCode] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  const isUsui = strategyCode === 'USUI_1toMany';
  const isComplete = dispatch?.status === 'COMPLETED';

  const loadDispatch = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE}/dispatch/${id}`);
    setDispatch(res.data.dispatch);
    setLogs(res.data.logs || []);
    
    // FIX: Read strategy code directly from dispatch (no admin endpoint needed)
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

  const handleExportPDF = () => {
    if (dispatch) exportDispatchPDF(dispatch, logs);
  };

  if (loading || !dispatch) {
    return (
      <div style={{ minHeight: '100vh', background: '#1B1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading dispatch...</div>
      </div>
    );
  }

  const progress = dispatch.total_schedule_bins > 0 
    ? Math.round((dispatch.smg_qty / dispatch.total_schedule_bins) * 100) : 0;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
        fontFamily: "'DM Sans','Segoe UI',sans-serif"
      }}>
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 10, background: 'rgba(27,27,75,0.88)', 
          backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', 
          padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' 
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
            Dispatch #{dispatch.dispatch_number}
          </div>
          <button onClick={() => navigate(-1)} style={{ 
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', 
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', 
            padding: '6px 12px', cursor: 'pointer' 
          }}>← Back</button>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px' }}>
          {/* Summary Card */}
          <div style={{ 
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '14px', padding: '20px', marginBottom: '16px' 
          }}>
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
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    {String(item.value || '—')}
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>SCAN PROGRESS</span>
                <span style={{ color: '#78BE20', fontSize: '12px', fontWeight: 700 }}>
                  {dispatch.smg_qty}/{dispatch.total_schedule_bins} · {progress}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${progress}%`, 
                  background: 'linear-gradient(90deg,#78BE20,#aee860)', 
                  transition: 'width 0.5s ease' 
                }} />
              </div>
            </div>
          </div>

          {message && (
            <div style={{ 
              padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
              background: message.type === 'success' ? 'rgba(120,190,32,0.12)' : 'rgba(255,80,80,0.12)',
              border: `1px solid ${message.type === 'success' ? 'rgba(120,190,32,0.35)' : 'rgba(255,80,80,0.35)'}`,
              color: message.type === 'success' ? '#78BE20' : '#ff7070', fontSize: '13px'
            }}>
              {message.text}
            </div>
          )}

          {isComplete ? (
            <div style={{ 
              background: 'linear-gradient(135deg,rgba(120,190,32,0.18),rgba(120,190,32,0.06))', 
              border: '1px solid rgba(120,190,32,0.4)', borderRadius: '16px', 
              padding: '32px 24px', textAlign: 'center',
              animation: 'successPop 0.5s ease both'
            }}>
              <div style={{ color: '#78BE20', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                Batch Complete!
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '28px' }}>
                All scans completed successfully
              </div>
              <button onClick={handleExportPDF} style={{ 
                padding: '12px 32px', borderRadius: '10px', 
                border: '1px solid rgba(120,190,32,0.5)', 
                background: 'rgba(120,190,32,0.12)', color: '#78BE20', 
                fontSize: '14px', fontWeight: 600, cursor: 'pointer' 
              }}>
                ↓ Export PDF Report
              </button>
            </div>
          ) : (
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