import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the structure of the strategy configuration
interface StrategyConfig {
  product: boolean;
  casePack: boolean;
  date: boolean;
  schedule: boolean;
}

interface StrategyFormData {
  name: string;
  code: string;
  description: string;
  config: StrategyConfig;
}

export default function StrategyManagement() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<StrategyFormData>({ 
    name: '', 
    code: '', 
    description: '', 
    config: { product: true, casePack: true, date: true, schedule: true } 
  });

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/admin/strategies`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStrategies(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStrategies(); }, []);

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/admin/strategies`, formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setIsModalOpen(false);
      fetchStrategies();
    } catch (e) { alert('Error saving strategy'); }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Create Strategy</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
          <thead style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>Strategy Name</th>
              <th style={{ padding: '16px' }}>Code</th>
              <th style={{ padding: '16px' }}>Description</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{s.code}</td>
                <td style={{ padding: '16px', fontSize: '13px' }}>{s.description}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                   <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1B1B4B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#fff' }}>Create Validation Strategy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Strategy Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Internal Code</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Required Fields:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {(Object.keys(formData.config) as Array<keyof StrategyConfig>).map(field => (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.config[field]} 
                        onChange={() => setFormData(prev => ({
                          ...prev, 
                          config: { ...prev.config, [field]: !prev.config[field] }
                        }))} 
                        style={{ accentColor: '#78BE20' }} 
                      />
                      {field.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px 20px' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Save Strategy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
