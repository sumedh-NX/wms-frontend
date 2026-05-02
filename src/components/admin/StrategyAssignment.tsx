import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StrategyAssignment() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]); // NEW: To store the table data
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState({ customerId: '', strategyId: '' });
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [custRes, stratRes, assignRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE}/admin/customers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE}/admin/strategies`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE}/admin/customer-strategies`, { headers: { Authorization: `Bearer ${token}` } }) // NEW
      ]);
      setCustomers(custRes.data);
      setStrategies(stratRes.data);
      setAssignments(assignRes.data); // NEW
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async () => {
    if (!assignment.customerId || !assignment.strategyId) return alert('Please select both');
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/admin/customer-strategy`, {
        customerId: assignment.customerId,
        strategyId: assignment.strategyId
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Strategy assigned successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchData(); // Refresh table
    } catch (e) { alert('Error assigning strategy'); }
  };

  const handleRemove = async (customerId: number) => {
    if(!window.confirm('Remove this strategy from customer?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE}/admin/customer-strategy/${customerId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData(); // Refresh table
    } catch (e) { alert('Error removing strategy'); }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
      {message && <div style={{ background: 'rgba(120,190,32,0.2)', color: '#78BE20', padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #78BE20' }}>{message}</div>}
      
      {/* ASSIGNMENT FORM */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '24px', textAlign: 'center' }}>Assign Validation Strategy</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Select Customer</label>
            <select value={assignment.customerId} onChange={e => setAssignment({...assignment, customerId: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Select Strategy</label>
            <select value={assignment.strategyId} onChange={e => setAssignment({...assignment, strategyId: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
              <option value="">-- Choose Strategy --</option>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={handleAssign} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', marginTop: '10px' }}>Link Strategy to Customer</button>
        </div>
      </div>

      {/* VISIBILITY TABLE */}
      <div style={{ width: '100%', maxWidth: '800px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600 }}>Current Assignments</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
          <thead style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>Customer</th>
              <th style={{ padding: '16px' }}>Assigned Strategy</th>
              <th style={{ padding: '16px' }}>Strategy Code</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No strategies assigned yet.</td></tr>
            ) : (
              assignments.map(a => (
                <tr key={a.customer_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{a.customer_name}</td>
                  <td style={{ padding: '16px' }}>{a.strategy_name}</td>
                  <td style={{ padding: '16px', color: '#78BE20', fontSize: '13px' }}>{a.strategy_code}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleRemove(a.customer_id)} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff7070', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
