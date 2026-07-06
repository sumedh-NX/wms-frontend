import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ItemMasterManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ item_code: '', item_name: '', case_pack: '' });

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/admin/customers`, authHeaders());
      setCustomers(res.data);
      if (res.data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(String(res.data[0].id));
      }
    } catch (e) {
      console.error('Fetch customers error:', e);
    }
  };

  const fetchItems = async (customerId: string) => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE}/admin/customers/${customerId}/items`, authHeaders());
      setItems(res.data);
    } catch (e) {
      console.error('Fetch items error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { fetchItems(selectedCustomerId); }, [selectedCustomerId]);

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ item_code: item.item_code, item_name: item.item_name || '', case_pack: String(item.case_pack) });
    } else {
      setEditingItem(null);
      setFormData({ item_code: '', item_name: '', case_pack: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      item_code: formData.item_code.trim(),
      item_name: formData.item_name.trim(),
      case_pack: parseInt(formData.case_pack, 10),
    };
    try {
      if (editingItem) {
        await axios.put(`${import.meta.env.VITE_API_BASE}/admin/items/${editingItem.id}`, payload, authHeaders());
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE}/admin/customers/${selectedCustomerId}/items`, payload, authHeaders());
      }
      setIsModalOpen(false);
      fetchItems(selectedCustomerId);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error saving item');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete item ${item.item_code}?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE}/admin/items/${item.id}`, authHeaders());
      fetchItems(selectedCustomerId);
    } catch (e) {
      alert('Error deleting item');
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <select
          value={selectedCustomerId}
          onChange={e => setSelectedCustomerId(e.target.value)}
          style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '14px' }}
        >
          {customers.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#1B1B4B' }}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => openModal()}
          disabled={!selectedCustomerId}
          style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, cursor: selectedCustomerId ? 'pointer' : 'not-allowed', opacity: selectedCustomerId ? 1 : 0.5 }}
        >
          + Add Item
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
          <thead style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px' }}>Item Code</th>
              <th style={{ padding: '16px' }}>Item Name</th>
              <th style={{ padding: '16px' }}>Case Pack</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  No items yet for this customer
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{item.item_code}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{item.item_name || '—'}</td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{item.case_pack}</td>
                <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => openModal(item)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                  <button onClick={() => handleDelete(item)} style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.4)', color: '#ff7070', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1B1B4B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '400px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#fff' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Item Code</label>
                <input value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Item Name</label>
                <input value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Case Pack</label>
                <input type="number" value={formData.case_pack} onChange={e => setFormData({ ...formData, case_pack: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px 20px' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: '#78BE20', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
