import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';
import CustomerManagement from '../components/admin/CustomerManagement';
import StrategyManagement from '../components/admin/StrategyManagement'; // IMPORTED
import StrategyAssignment from '../components/admin/StrategyAssignment'; // IMPORTED

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  const page: React.CSSProperties = {
    minHeight: '100vh', background: 'linear-gradient(160deg,#1B1B4B 0%,#12123a 50%,#0d0d30 100%)',
    fontFamily: "'DM Sans',sans-serif", padding: '40px 20px', color: '#fff'
  };

  const tabs = [
    { id: 'users', label: 'Staff Management' },
    { id: 'customers', label: 'Customer Master' },
    { id: 'strategies', label: 'Validation Strategies' },
    { id: 'assignments', label: 'Strategy Assignments' },
  ];

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={page}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => navigate('/')} 
                style={{ 
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', 
                  borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', 
                  padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ← Back to Home
              </button>
              <div>
                <h1 style={{ fontSize: '28px', margin: 0, letterSpacing: '-0.5px' }}>Admin Control Panel</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Control staff access and customer assignments</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: '12px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
                  background: activeTab === tab.id ? '#78BE20' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid #fff' : '3px solid transparent',
                  transition: 'all 0.2s', borderRadius: '8px 8px 0 0'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            {/* FIXED: Replaced placeholders with actual components */}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'customers' && <CustomerManagement />}
            {activeTab === 'strategies' && <StrategyManagement />}
            {activeTab === 'assignments' && <StrategyAssignment />}
          </div>
        </div>
      </div>
    </>
  );
}
