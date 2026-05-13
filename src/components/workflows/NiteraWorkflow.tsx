import { useState } from 'react';
import axios from 'axios';
import CameraScanner from '../CameraScanner';

interface NiteraWorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

export default function NiteraWorkflow({ dispatchId, dispatch, onDispatchUpdate, onMessage }: NiteraWorkflowProps) {
  const [scanInput, setScanInput] = useState('');
  
  const showBin = !dispatch || dispatch.smg_qty <= dispatch.bin_qty;
  
  const handleSubmit = async () => {
    if (!scanInput.trim()) return;
    const input = scanInput.trim();
    
    try {
      const endpoint = showBin ? 'scan-bin' : 'scan-pick';
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE}/dispatch/${dispatchId}/${endpoint}`, 
        { rawQr: input }
      );
      
      if (res.data) onDispatchUpdate(res.data);
      onMessage({ type: 'success', text: `${showBin ? 'Bin' : 'Pick'} accepted` });
      setScanInput('');
    } catch (err: any) {
      onMessage({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
      setScanInput('');
    }
  };
  
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.04)', 
      border: `1px solid ${showBin ? 'rgba(232,168,0,0.4)' : 'rgba(120,190,32,0.4)'}`, 
      borderRadius: '14px', padding: '20px', marginBottom: '16px',
      animation: 'fadeUp 0.4s ease 0.1s both'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            {showBin ? 'Scan Bin Label' : 'Scan Pick-list'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
            {showBin ? 'Step 1 of 2' : 'Step 2 of 2'}
          </div>
        </div>
        <div style={{ 
          background: showBin ? 'rgba(232,168,0,0.12)' : 'rgba(120,190,32,0.12)', 
          borderRadius: '20px', padding: '3px 12px', 
          color: showBin ? '#e8a800' : '#78BE20', fontSize: '11px', fontWeight: 600 
        }}>
          {showBin ? `${dispatch.smg_qty}/${dispatch.total_schedule_bins}` : `${dispatch.bin_qty}/${dispatch.total_schedule_bins}`}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input 
          autoFocus type="text" 
          placeholder={showBin ? "Scan bin QR..." : "Scan pick-list QR..."}
          value={scanInput} 
          onChange={e => setScanInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
          style={{ 
            flex: 1, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', 
            border: `1px solid ${showBin ? 'rgba(232,168,0,0.3)' : 'rgba(120,190,32,0.3)'}`, 
            borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' 
          }} 
        />
        <button 
          onClick={() => setScanInput('')} 
          style={{ 
            padding: '0 14px', background: 'rgba(255,255,255,0.06)', 
            border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', 
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer' 
          }}
        >✕</button>
      </div>
      <CameraScanner onScan={txt => setScanInput(txt)} />
    </div>
  );
}