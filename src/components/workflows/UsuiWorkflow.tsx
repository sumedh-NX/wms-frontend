import { useState } from 'react';
import axios from 'axios';
import CameraScanner from '../CameraScanner';

interface UsuiWorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

export default function UsuiWorkflow({ dispatchId, dispatch, onDispatchUpdate, onMessage }: UsuiWorkflowProps) {
  const [step, setStep] = useState<'NX' | 'BIN' | 'PART'>(dispatch?.ref_product_code ? 'BIN' : 'NX');
  const [scanInput, setScanInput] = useState('');
  const [scannedParts, setScannedParts] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState(0);
  const [currentBinId, setCurrentBinId] = useState<number | null>(null);
  
  const handleSubmit = async () => {
    if (!scanInput.trim()) return;
    const input = scanInput.trim();
    
    try {
      let res: any;
      
      if (step === 'NX') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-nx`, { rawQr: input });
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setStep('BIN');
      } 
      else if (step === 'BIN') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-bin-usui`, { rawQr: input });
        if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        setCurrentBinId(res.data.binId);
        setRequiredParts(res.data.requiredParts);
        setScannedParts([]);
        setStep('PART');
      } 
      else if (step === 'PART') {
        res = await axios.post(`${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/scan-part`, { 
          rawQr: input, binId: currentBinId 
        });
        
        // Small delay to ensure DB commit, then update
        setTimeout(() => {
          if (res.data.dispatch) onDispatchUpdate(res.data.dispatch);
        }, 100);
        
        setScannedParts(prev => [...prev, res.data.partCode]);
        
        if (res.data.count >= requiredParts) {
          onMessage({ type: 'success', text: 'Bin Complete! Scan next Bin.' });
          setStep('BIN');
        }
      }
      
      setScanInput('');
      onMessage({ type: 'success', text: 'Scan accepted' });
    } catch (err: any) {
      onMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
      setScanInput('');
    }
  };
  
  const stepConfig = {
    NX: { title: 'Scan NX Product QR', subtitle: 'Step 1 of 3', color: '#e8a800', bgColor: 'rgba(232,168,0,0.05)', borderColor: 'rgba(232,168,0,0.4)' },
    BIN: { title: 'Scan Bin Label', subtitle: 'Step 2 of 3', color: '#e8a800', bgColor: 'rgba(232,168,0,0.05)', borderColor: 'rgba(232,168,0,0.4)' },
    PART: { title: 'Scan In-Bin Parts', subtitle: 'Step 3 of 3', color: '#78BE20', bgColor: 'rgba(120,190,32,0.05)', borderColor: 'rgba(120,190,32,0.4)' }
  };
  
  const cfg = stepConfig[step];
  
  return (
    <>
      <div style={{ 
        background: cfg.bgColor, border: `1px solid ${cfg.borderColor}`, 
        borderRadius: '14px', padding: '20px', marginBottom: '16px',
        animation: 'fadeUp 0.4s ease 0.1s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{cfg.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{cfg.subtitle}</div>
          </div>
          {step === 'PART' && (
            <div style={{ 
              background: 'rgba(120,190,32,0.12)', borderRadius: '20px', 
              padding: '3px 12px', color: '#78BE20', fontSize: '11px', fontWeight: 600 
            }}>
              {scannedParts.length}/{requiredParts}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input 
            autoFocus type="text" 
            placeholder={`Scan ${step} QR...`}
            value={scanInput} 
            onChange={e => setScanInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
            style={{ 
              flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', 
              border: `1px solid ${cfg.borderColor}`, borderRadius: '10px', 
              color: '#fff', fontSize: '14px', outline: 'none' 
            }} 
          />
          <button onClick={() => setScanInput('')} style={{ 
            padding: '0 14px', background: 'rgba(255,255,255,0.06)', 
            border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', 
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer' 
          }}>✕</button>
        </div>
        <CameraScanner onScan={txt => setScanInput(txt)} />
      </div>
      
      {step === 'PART' && (
        <div style={{ 
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '14px', padding: '20px', marginBottom: '16px',
          animation: 'fadeUp 0.4s ease both'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' }}>
            Parts: <span style={{ color: '#78BE20' }}>{scannedParts.length} / {requiredParts}</span>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
            {scannedParts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', padding: '20px 0' }}>
                No parts scanned yet.
              </div>
            ) : (
              scannedParts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{i + 1}. {p}</span>
                  <span style={{ color: '#78BE20' }}>✓</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}