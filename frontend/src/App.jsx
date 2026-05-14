import React, { useState } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setUser({ email });
      setLoading(false);
      fetchCampaigns();
    }, 500);
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/campaigns/690235150132517`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCampaignsLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Meta Performance</h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6', margin: '0 0 32px' }}>Engine</h2>
          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px', marginBottom: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '20px 0 0' }}>Demo: test@example.com / password123</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Meta Performance Engine</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '8px 0 0' }}>Spatial Sleep - Account: 690235150132517</p>
          </div>
          <button onClick={() => setUser(null)} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px' }}>Campaign Performance</h2>
          
          {campaignsLoading && <p style={{ color: '#94a3b8' }}>Loading campaigns...</p>}
          {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}
          
          {campaigns.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600' }}>Campaign Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600' }}>Objective</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600' }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#e2e8f0' }}>{c.name}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{c.objective}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{c.status}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{c.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !campaignsLoading && <p style={{ color: '#94a3b8' }}>No campaigns found</p>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '40px 0 0' }}>Backend: {API_URL}</p>
      </div>
    </div>
  );
}
