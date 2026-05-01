import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Dispatch {
  id: number;
  dispatch_number: string;
  customer_id: string;
  status: string;
  ref_product_code: string;
  ref_schedule_number: string;
  ref_supply_date: string;
  ref_schedule_sent_date: string;
  total_schedule_bins: number;
  smg_qty: number;
  bin_qty: number;
  created_at: string;
}

export default function DispatchBoard() {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get customerId from URL params or sessionStorage
  const customerId = new URLSearchParams(window.location.search).get('customerId') || 
                     sessionStorage.getItem('customerId') || 
                     localStorage.getItem('customerId') || '';

  const loadDispatches = async () => {
    try {
      if (!customerId) {
        setError('Customer ID not found. Please select a customer first.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('customerId', customerId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE}/dispatch?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDispatches(res.data);
      setError(null);
    } catch (e: any) {
      console.error('Error loading dispatches:', e);
      setError(e.response?.data?.message || 'Failed to load dispatches');
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [customerId, startDate, endDate]);

  const filtered = dispatches.filter(d => {
    if (filter === 'open') return d.status !== 'COMPLETED';
    if (filter === 'completed') return d.status === 'COMPLETED';
    return true;
  });

  const stats = {
    total: dispatches.length,
    open: dispatches.filter(d => d.status !== 'COMPLETED').length,
    completed: dispatches.filter(d => d.status === 'COMPLETED').length,
  };

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    padding: '24px 20px',
  };

  const header: React.CSSProperties = {
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const title: React.CSSProperties = {
    color: '#fff',
    fontSize: '28px',
    fontWeight: 700,
  };

  const statsContainer: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  };

  const statCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  };

  const statValue: React.CSSProperties = {
    color: '#78BE20',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
  };

  const statLabel: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const filterBar: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const filterButton = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: isActive ? '1px solid #78BE20' : '1px solid rgba(255,255,255,0.10)',
    background: isActive ? 'rgba(120,190,32,0.15)' : 'rgba(255,255,255,0.04)',
    color: isActive ? '#78BE20' : 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  });

  const dateInput: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: '12px',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const tableContainer: React.CSSProperties = {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  };

  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeader: React.CSSProperties = {
    background: 'rgba(120,190,32,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  };

  const tableHeaderCell: React.CSSProperties = {
    padding: '14px',
    textAlign: 'left',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  };

  const tableBodyRow = (index: number): React.CSSProperties => ({
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
    transition: 'background 0.2s ease',
    cursor: 'pointer',
  });

  const tableBodyCell: React.CSSProperties = {
    padding: '14px',
    color: '#fff',
    fontSize: '13px',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  };

  const statusBadge = (status: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    background: status === 'COMPLETED' ? 'rgba(120,190,32,0.2)' : 'rgba(232,168,0,0.2)',
    color: status === 'COMPLETED' ? '#78BE20' : '#e8a800',
  });

  const emptyState: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'rgba(255,255,255,0.3)',
  };

  const errorState: React.CSSProperties = {
    background: 'rgba(255,80,80,0.12)',
    border: '1px solid rgba(255,80,80,0.35)',
    borderRadius: '12px',
    padding: '16px',
    color: '#ff7070',
    marginBottom: '20px',
  };

  if (loading) {
    return (
      <div style={page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '12px' }} />
          Loading dispatches...
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
        table tbody tr:hover { background: rgba(120,190,32,0.08) !important; }
      `}</style>

      <div style={header}>
        <div>
          <div style={title}>Dispatches</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
            Manage outbound dispatch operations
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div style={errorState}>
          ⚠️ {error}
        </div>
      )}

      <div style={statsContainer}>
        <div style={statCard}>
          <div style={statValue}>{stats.total}</div>
          <div style={statLabel}>Total</div>
        </div>
        <div style={statCard}>
          <div style={{ ...statValue, color: '#e8a800' }}>{stats.open}</div>
          <div style={statLabel}>Open</div>
        </div>
        <div style={statCard}>
          <div style={{ ...statValue, color: '#78BE20' }}>{stats.completed}</div>
          <div style={statLabel}>Completed</div>
        </div>
      </div>

      <div style={filterBar}>
        <button onClick={() => setFilter('all')} style={filterButton(filter === 'all')}>
          All Dispatches
        </button>
        <button onClick={() => setFilter('open')} style={filterButton(filter === 'open')}>
          Open
        </button>
        <button onClick={() => setFilter('completed')} style={filterButton(filter === 'completed')}>
          Completed
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={dateInput}
          />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={dateInput}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div>No dispatches found</div>
        </div>
      ) : (
        <div style={tableContainer}>
          <table style={table}>
            <thead style={tableHeader}>
              <tr>
                <th style={tableHeaderCell}>Dispatch No</th>
                <th style={tableHeaderCell}>Product Code</th>
                <th style={tableHeaderCell}>Schedule No</th>
                <th style={tableHeaderCell}>Schedule Bin No</th>
                <th style={tableHeaderCell}>Nagara Time</th>
                <th style={tableHeaderCell}>Dispatch Date</th>
                <th style={tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dispatch, idx) => (
                <tr
                  key={dispatch.id}
                  style={tableBodyRow(idx)}
                  onClick={() => navigate(`/dispatch/${dispatch.id}`)}
                >
                  <td style={tableBodyCell}>DSP-{dispatch.dispatch_number}</td>
                  <td style={tableBodyCell}>{dispatch.ref_product_code}</td>
                  <td style={tableBodyCell}>{dispatch.ref_schedule_number}</td>
                  <td style={tableBodyCell}>{dispatch.total_schedule_bins}</td>
                  <td style={tableBodyCell}>
                    {dispatch.ref_supply_date ? new Date(dispatch.ref_supply_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={tableBodyCell}>
                    {new Date(dispatch.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={tableBodyCell}>
                    <span style={statusBadge(dispatch.status)}>
                      {dispatch.status === 'COMPLETED' ? '✓ Completed' : '◯ Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}