import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import axios from 'axios';
import CameraScanner from '../CameraScanner';

interface NhkWorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

const PARTS_PER_BIN = 5;

const STEP_CFG = {
  NX: {
    step: 1, total: 3,
    label: 'SCAN NX KANBAN',
    hint:  'Scan the NX Kanban product code barcode',
    color: '#1565C0',
    light: 'rgba(21,101,192,0.08)',
    border: 'rgba(21,101,192,0.5)',
    placeholder: 'Scan NX Kanban...',
  },
  BIN: {
    step: 2, total: 3,
    label: 'SCAN SMG BIN LABEL',
    hint:  'Scan the SMG Bin QR label',
    color: '#E65C00',
    light: 'rgba(230,92,0,0.08)',
    border: 'rgba(230,92,0,0.5)',
    placeholder: 'Scan bin QR code...',
  },
  PART: {
    step: 3, total: 3,
    label: 'SCAN IN-PRODUCT QR',
    hint:  `Scan ${PARTS_PER_BIN} In-Product QR codes for this bin`,
    color: '#5a9218',
    light: 'rgba(120,190,32,0.08)',
    border: 'rgba(120,190,32,0.5)',
    placeholder: 'Scan in-product QR...',
  },
};

export default function NhkWorkflow({ dispatchId, dispatch, onDispatchUpdate, onMessage }: NhkWorkflowProps) {
  const [step, setStep]                 = useState<'NX' | 'BIN' | 'PART'>(dispatch?.ref_product_code ? 'BIN' : 'NX');
  const [scanInput, setScanInput]       = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [scannedParts, setScannedParts] = useState<string[]>([]);
  const [currentBinId, setCurrentBinId] = useState<number | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // BIN QR is multiline (27 lines). Hardware scanners send each line then an Enter,
  // so a plain <input type="text"> receives only one line before the first Enter fires.
  // We accumulate lines here across Enter presses, then submit the full QR after a
  // short idle period.
  const accumRef  = useRef(''); // lines committed by Enter so far
  const latestRef = useRef(''); // mirror of scanInput — avoids stale-closure reads

  useEffect(() => {
    if (!submitting) inputRef.current?.focus();
  }, [step, submitting]);

  const cfg = STEP_CFG[step];

  const handleSubmit = async () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }

    // For BIN: join all accumulated lines + whatever remains in the input field.
    // For NX / PART: single-line, just use the current input value.
    const raw = step === 'BIN'
      ? (accumRef.current + latestRef.current).trim()
      : latestRef.current.trim();

    accumRef.current  = '';
    latestRef.current = '';

    if (!raw || submitting) return;
    setScanInput('');
    setSubmitting(true);

    try {
      let res: any;

      if (step === 'NX') {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-nx-nhk`,
          { rawQr: raw }
        );
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setStep('BIN');

      } else if (step === 'BIN') {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-bin-nhk`,
          { rawQr: raw }
        );
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setCurrentBinId(res.data.binId);
        setScannedParts([]);
        setStep('PART');

      } else if (step === 'PART') {
        res = await axios.post(
          `${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-part-nhk`,
          { rawQr: raw, binId: currentBinId }
        );
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setScannedParts(prev => [...prev, res.data.partCode]);

        if (res.data.count >= PARTS_PER_BIN) {
          onMessage({ type: 'success', text: `Bin complete (${PARTS_PER_BIN}/${PARTS_PER_BIN} parts)! Scan next Bin.` });
          setStep('BIN');
          return;
        }
      }

      onMessage({ type: 'success', text: 'Scan accepted' });
    } catch (err: any) {
      onMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setScanInput(val);
    latestRef.current = val;
    if (step === 'BIN') {
      // Reschedule submit — handles the case where the scanner sends no trailing Enter
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(handleSubmit, 300);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (step === 'BIN') {
      // Each Enter from the scanner = a line break inside the multiline QR.
      // Append the current line to the accumulator, clear the visible input, and
      // restart the idle timer. When no new input arrives for 200 ms, submit fires.
      e.preventDefault();
      accumRef.current  += latestRef.current + '\n';
      latestRef.current  = '';
      setScanInput('');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(handleSubmit, 200);
    } else {
      handleSubmit();
    }
  };

  const handleClear = () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    accumRef.current  = '';
    latestRef.current = '';
    setScanInput('');
  };

  return (
    <>
      <div style={{
        background: cfg.light,
        border: `2px solid ${cfg.border}`,
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {/* Step banner */}
        <div style={{ background: cfg.color, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {cfg.step}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>{cfg.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '11px', marginTop: '2px' }}>{cfg.hint}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.20)', borderRadius: '20px',
              padding: '3px 10px', color: '#fff', fontSize: '11px', fontWeight: 700,
            }}>
              STEP {cfg.step} / {cfg.total}
            </div>
            {step === 'PART' && (
              <div style={{
                background: 'rgba(255,255,255,0.14)', borderRadius: '20px',
                padding: '2px 10px', color: '#fff', fontSize: '11px', fontWeight: 600,
              }}>
                {scannedParts.length} / {PARTS_PER_BIN} parts
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px', background: 'rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${cfg.border}`,
        }}>
          {(['NX', 'BIN', 'PART'] as const).map((s, idx) => {
            const sCfg    = STEP_CFG[s];
            const isActive = s === step;
            const isDone   = sCfg.step < cfg.step;
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
                    color: isActive || isDone ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {isDone ? '✓' : sCfg.step}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: isActive ? '#fff' : isDone ? '#78BE20' : 'rgba(255,255,255,0.3)',
                  }}>
                    {s === 'NX' ? 'NX Kanban' : s === 'BIN' ? 'Bin' : 'Parts'}
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
            ref={inputRef} autoFocus type="text"
            placeholder={submitting ? 'Processing...' : cfg.placeholder}
            value={scanInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
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
            onClick={handleClear}
            style={{
              padding: '0 14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px',
            }}
          >✕</button>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <CameraScanner onScan={txt => { accumRef.current = ''; latestRef.current = txt; setScanInput(txt); handleSubmit(); }} />
        </div>
      </div>

      {/* Parts list during PART step */}
      {step === 'PART' && (
        <div style={{
          background: 'rgba(120,190,32,0.04)',
          border: '1px solid rgba(120,190,32,0.15)',
          borderRadius: '14px', padding: '16px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              In-Product QRs scanned
            </span>
            <span style={{
              background: scannedParts.length >= PARTS_PER_BIN ? 'rgba(120,190,32,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${scannedParts.length >= PARTS_PER_BIN ? 'rgba(120,190,32,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '20px', padding: '2px 12px',
              color: scannedParts.length >= PARTS_PER_BIN ? '#78BE20' : '#fff',
              fontSize: '13px', fontWeight: 700,
            }}>
              {scannedParts.length} / {PARTS_PER_BIN}
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
