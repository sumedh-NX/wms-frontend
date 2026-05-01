import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'operator', customerIds: [] as number[] });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [userRes, custRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE}/admin/customers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(userRes.data);
      setCustomers(custRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      const currentCustomerNames = user.assigned_customers || [];
      const mappedIds = customers.filter(c => currentCustomerNames.includes(c.name)).map(c => c.id);
      setFormData({ email: user.email, password: '', role: user.role, customerIds: mappedIds });
    } else {
      setEditingUser(null);
      setFormData({ email: '', password: '', role: 'operator', customerIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      if (editingUser) {
        await axios.put(`${import.meta.env.VITE_API_BASE}/admin/users/${editingUser.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE}/admin/users`, formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsModalOpen(false);
      fetchAdminData();
    } catch (e) { alert('Error saving user'); }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`${import.meta.env.VITE_API_BASE}/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAdminData();
  };

  const toggleCustomer = (id: number) => {
    setFormData(prev => ({ ...prev, customerIds: prev.customerIds.includes(id) ? prev.customerIds.filter(cId => cId !== id) : [...prev.customerIds, id] }));
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => openModal()} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add User</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
          <thead style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>User</th>
              <th style={{ padding: '16px' }}>Role</th>
              <th style={{ padding: '16px' }}>Assigned Customers</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <td style={{ padding: '16px' }}>{u.email}</td>
                <td style={{ padding: '16px' }}><span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>{u.role}</span></td>
                <td style={{ padding: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{u.assigned_customers?.join(', ') || 'None'}</td>
                <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => openModal(u)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                  <button onClick={() => deleteUser(u.id)} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff7070', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1B1B4B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#fff' }}>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Email</label>
                <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="operator">Operator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Customers</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {customers.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer', color: '#fff' }}>
                      <input type="checkbox" checked={formData.customerIds.includes(c.id)} onChange={() => toggleCustomer(c.id)} style={{ accentColor: '#78BE20' }} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px 20px' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Save User</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const toggleCustomer = (id: number) => {
    setFormData(prev => ({ ...prev, customerIds: prev.customerIds.includes(id) ? prev.customerIds.filter(cId => cId !== id) : [...prev.customerIds, id] }));
  };
}
