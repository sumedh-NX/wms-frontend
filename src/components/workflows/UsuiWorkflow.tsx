import { useState } from 'react';
import axios from 'axios';
import CameraScanner from '../CameraScanner';

interface UsuiWorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

const STEP_CFG = {
  NX: {
    step: 1, total: 3,
    label: 'SCAN NX PRODUCT LABEL',
    hint:  'Scan the NX product QR code first',
    color: '#1565C0',
    light: 'rgba(21,101,192,0.08)',
    border: 'rgba(21,101,192,0.5)',
    placeholder: 'Scan NX product QR...',
  },
  BIN: {
    step: 2, total: 3,
    label: 'SCAN BIN LABEL',
    hint:  'Scan the Bin QR label',
    color: '#E65C00',
    light: 'rgba(230,92,0,0.08)',
    border: 'rgba(230,92,0,0.5)',
    placeholder: 'Scan bin QR code...',
  },
  PART: {
    step: 3, total: 3,
    label: 'SCAN IN-BIN PARTS',
    hint:  'Scan each part inside the current bin',
    color: '#5a9218',
    light: 'rgba(120,190,32,0.08)',
    border: 'rgba(120,190,32,0.5)',
    placeholder: 'Scan part QR code...',
  },
};

export default function UsuiWorkflow({ dispatchId, dispatch, onDispatchUpdate, onMessage }: UsuiWorkflowProps) {
  const [step, setStep]             = useState<'NX' | 'BIN' | 'PART'>(dispatch?.ref_product_code ? 'BIN' : 'NX');
  const [scanInput, setScanInput]   = useState('');
  const [scannedParts, setScannedParts] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState(0);
  const [currentBinId, setCurrentBinId] = useState<number | null>(null);

  const cfg = STEP_CFG[step];

  const handleSubmit = async () => {
    if (!scanInput.trim()) return;
    const input = scanInput.trim();

    try {
      let res: any;

      if (step === 'NX') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-nx`, { rawQr: input });
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setStep('BIN');

      } else if (step === 'BIN') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-bin-usui`, { rawQr: input });
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setCurrentBinId(res.data.binId);
        setRequiredParts(res.data.requiredParts);
        setScannedParts([]);
        setStep('PART');

      } else if (step === 'PART') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-part`, {
          rawQr: input, binId: currentBinId
        });
        setTimeout(() => { if (res.data.dispatch) onDispatchUpdate(res.data.dispatch); }, 100);
        setScannedParts(prev => [...prev, res.data.partCode]);

        if (res.data.count >= requiredParts) {
          onMessage({ type: 'success', text: 'Bin complete! Scan next Bin.' });
          setStep('BIN');
          setScanInput('');
          return;
        }
      }

      setScanInput('');
      onMessage({ type: 'success', text: 'Scan accepted' });
    } catch (err: any) {
      onMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
      setScanInput('');
    }
  };

  return (
    <>
      {/* ── Main scan box ── */}
      <div style={{
        background: cfg.light,
        border: `2px solid ${cfg.border}`,
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {/* Coloured step banner */}
        <div style={{
          background: cfg.color,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {/* Step number badge */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 800, color: '#fff', flexShrink: 0,
            letterSpacing: '-1px',
          }}>
            {cfg.step}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>
              {cfg.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '11px', marginTop: '2px' }}>
              {cfg.hint}
            </div>
          </div>

          {/* Step pill + counter */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.20)',
              borderRadius: '20px', padding: '3px 10px',
              color: '#fff', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              STEP {cfg.step} / {cfg.total}
            </div>
            {step === 'PART' && (
              <div style={{
                background: 'rgba(255,255,255,0.14)',
                borderRadius: '20px', padding: '2px 10px',
                color: '#fff', fontSize: '11px', fontWeight: 600,
              }}>
                {scannedParts.length} / {requiredParts} parts
              </div>
            )}
          </div>
        </div>

        {/* Step breadcrumb indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0',
          padding: '8px 16px', background: 'rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${cfg.border}`,
        }}>
          {(['NX', 'BIN', 'PART'] as const).map((s, idx) => {
            const sCfg = STEP_CFG[s];
            const isActive = s === step;
            const isDone   = STEP_CFG[s].step < cfg.step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '20px',
                  background: isActive ? sCfg.color : isDone ? 'rgba(120,190,32,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? sCfg.color : isDone ? 'rgba(120,190,32,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: isActive ? 'rgba(255,255,255,0.3)' : isDone ? '#78BE20' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700,
                    color: isActive ? '#fff' : isDone ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {isDone ? '✓' : sCfg.step}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: isActive ? '#fff' : isDone ? '#78BE20' : 'rgba(255,255,255,0.3)',
                  }}>
                    {s === 'NX' ? 'NX Label' : s === 'BIN' ? 'Bin' : 'Parts'}
                  </span>
                </div>
                {idx < 2 && (
                  <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
          <input
            autoFocus type="text"
            placeholder={cfg.placeholder}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              flex: 1, padding: '12px 14px',
              background: 'rgba(0,0,0,0.22)',
              border: `1.5px solid ${cfg.border}`,
              borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
            }}
          />
          <button
            onClick={() => setScanInput('')}
            style={{
              padding: '0 14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <CameraScanner onScan={txt => setScanInput(txt)} />
        </div>
      </div>

      {/* ── Parts list (only during PART step) ── */}
      {step === 'PART' && (
        <div style={{
          background: 'rgba(120,190,32,0.04)',
          border: '1px solid rgba(120,190,32,0.15)',
          borderRadius: '14px', padding: '16px', marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Parts scanned
            </span>
            <span style={{
              background: scannedParts.length >= requiredParts ? 'rgba(120,190,32,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${scannedParts.length >= requiredParts ? 'rgba(120,190,32,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '20px', padding: '2px 12px',
              color: scannedParts.length >= requiredParts ? '#78BE20' : '#fff',
              fontSize: '13px', fontWeight: 700,
            }}>
              {scannedParts.length} / {requiredParts}
            </span>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '8px' }}>
            {scannedParts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', padding: '16px 0' }}>
                No parts scanned yet
              </div>
            ) : (
              scannedParts.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{i + 1}. {p}</span>
                  <span style={{ color: '#78BE20', fontWeight: 700 }}>OK</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
