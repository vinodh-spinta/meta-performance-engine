import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://meta-performance-engine-production.up.railway.app';

export default function MetaDashboard() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('690235150132517'); // Spatial Sleep
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState('');

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simple auth - in production this would be real
    setTimeout(() => {
      setUser({ email, id: 1 });
      setLoading(false);
      fetchCampaigns('690235150132517');
    }, 500);
  };

  // Fetch campaigns from backend
  const fetchCampaigns = async (adAccountId) => {
    setCampaignsLoading(true);
    setCampaignsError('');
    
    try {
      console.log(`Fetching campaigns for account: ${adAccountId}`);
      const response = await fetch(`${API_URL}/api/campaigns/${adAccountId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Campaigns response:', data);
      
      if (data.campaigns && data.campaigns.length > 0) {
        setCampaigns(data.campaigns);
      } else if (data.error) {
        setCampaignsError(`Backend error: ${data.error}`);
        setCampaigns([]);
      } else {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaignsError(`Error: ${err.message}. Make sure backend is running at ${API_URL}`);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCampaigns([]);
    setCampaignsError('');
  };

  // Login screen
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif' 
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '40px', 
          width: '100%', 
          maxWidth: '420px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)' 
        }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>
            Meta Performance
          </h1>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>
            Engine
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            AI-powered ads analytics & optimization
          </p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                Email
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  boxSizing: 'border-box', 
                  fontFamily: 'inherit' 
                }} 
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  boxSizing: 'border-box', 
                  fontFamily: 'inherit' 
                }} 
              />
            </div>
            
            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                marginBottom: '12px', 
                fontSize: '15px' 
              }}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          
          <p style={{ margin: '20px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Demo: test@example.com / password123
          </p>
        </div>
      </div>
    );
  }

  // Dashboard screen
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700' }}>Meta Performance Engine</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Spatial Sleep - US (Account: 690235150132517)</p>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Logout
        </button>
      </div>

      {/* Status Section */}
      <div style={{ padding: '32px 40px' }}>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>Campaign Data</h2>
          
          {campaignsLoading && (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>⏳ Fetching real campaign data from Meta Ads...</p>
          )}
          
          {campaignsError && (
            <div style={{ background: '#7f1d1d', border: '1px solid #dc2626', borderRadius: '6px', padding: '16px', color: '#fca5a5', fontSize: '14px', marginBottom: '16px' }}>
              <strong>Connection Issue:</strong> {campaignsError}
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#fecaca' }}>
                <strong>Troubleshooting:</strong> Make sure the backend is running at {API_URL}
              </p>
            </div>
          )}
          
          {campaigns.length > 0 ? (
            <div>
              <p style={{ color: '#10b981', fontSize: '14px', marginBottom: '16px', fontWeight: '600' }}>
                ✅ Successfully connected to real Meta Ads data!
              </p>
              <div style={{ overflowX: 'auto', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                      <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Campaign Name</th>
                      <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Objective</th>
                      <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, i) => (
                      <tr key={campaign.id} style={{ borderBottom: i < campaigns.length - 1 ? '1px solid #334155' : 'none' }}>
                        <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: '500' }}>{campaign.name || 'N/A'}</td>
                        <td style={{ padding: '16px', color: '#cbd5e1' }}>{campaign.objective || 'N/A'}</td>
                        <td style={{ padding: '16px', color: '#cbd5e1' }}>
                          <span style={{ 
                            background: campaign.status === 'ACTIVE' ? '#10b981' : '#f59e0b', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {campaign.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{campaign.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !campaignsLoading && !campaignsError && (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No campaigns found. Check the backend connection.</p>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '40px', marginTop: '40px', borderTop: '1px solid #334155', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>Meta Performance Engine v1.0</p>
        <p style={{ margin: '8px 0 0' }}>Backend: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '3px', color: '#3b82f6' }}>{API_URL}</code></p>
        <p style={{ margin: '8px 0 0' }}>Fetching real data from Meta Ads via Claude API + Meta MCP</p>
      </div>
    </div>
  );
}
