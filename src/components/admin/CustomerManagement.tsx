import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage,
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/admin/customers`, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      });
      setCustomers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name, code: customer.code });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', code: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      if (editingCustomer) {
        alert('Edit Customer API not yet implemented in backend, but UI is ready!');
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE}/admin/customers`, formData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (e) { alert('Error saving customer'); }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => openModal()} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add Customer</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
          <thead style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>Customer Name</th>
              <th style={{ padding: '16px' }}>Company Code</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{c.code}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button onClick={() => openModal(c)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1B1B4B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '400px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#fff' }}>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Company Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Company Code</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px 20px' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Save Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
