import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CameraScanner from '../CameraScanner';

interface NiteraWorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

const STEP_CFG = {
  BIN: {
    step: 1, total: 2,
    label: 'SCAN BIN LABEL',
    hint:  'Point scanner at the Bin QR label',
    color: '#E65C00',
    light: 'rgba(230,92,0,0.08)',
    border: 'rgba(230,92,0,0.5)',
    placeholder: 'Scan bin QR code...',
  },
  PICK: {
    step: 2, total: 2,
    label: 'SCAN PICK-LIST',
    hint:  'Point scanner at the Pick-list QR code',
    color: '#5a9218',
    light: 'rgba(120,190,32,0.08)',
    border: 'rgba(120,190,32,0.5)',
    placeholder: 'Scan pick-list QR code...',
  },
};

export default function NiteraWorkflow({ dispatchId, dispatch, onDispatchUpdate, onMessage }: NiteraWorkflowProps) {
  const [scanInput, setScanInput]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showBin = !dispatch || dispatch.smg_qty <= dispatch.bin_qty;

  useEffect(() => {
    if (!submitting) inputRef.current?.focus();
  }, [showBin, submitting]);
  const cfg = showBin ? STEP_CFG.BIN : STEP_CFG.PICK;

  const counter = showBin
    ? `${dispatch?.smg_qty ?? 0} / ${dispatch?.total_schedule_bins ?? '—'} bins`
    : `${dispatch?.bin_qty ?? 0} / ${dispatch?.total_schedule_bins ?? '—'} picks`;

  const handleSubmit = async () => {
    if (!scanInput.trim() || submitting) return;
    const input = scanInput.trim();
    setScanInput('');     // clear immediately so the scanner can queue the next scan
    setSubmitting(true);
    try {
      const endpoint = showBin ? 'scan-bin' : 'scan-pick';
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/${endpoint}`,
        { rawQr: input }
      );
      if (res.data) onDispatchUpdate(res.data);
      onMessage({ type: 'success', text: `${showBin ? 'Bin' : 'Pick'} accepted` });
    } catch (err: any) {
      onMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
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

        <div style={{
          background: 'rgba(255,255,255,0.20)',
          borderRadius: '20px', padding: '4px 12px',
          color: '#fff', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          STEP {cfg.step} / {cfg.total}
        </div>
      </div>

      {/* Progress counter */}
      <div style={{
        padding: '10px 16px 0',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        <span style={{ color: cfg.color, fontSize: '13px', fontWeight: 700 }}>{counter}</span>
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          autoFocus type="text"
          placeholder={submitting ? 'Processing...' : cfg.placeholder}
          value={scanInput}
          onChange={e => setScanInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={submitting}
          style={{
            flex: 1, padding: '12px 14px',
            background: submitting ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.22)',
            border: `1.5px solid ${cfg.border}`,
            borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
            opacity: submitting ? 0.6 : 1,
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
  );
}