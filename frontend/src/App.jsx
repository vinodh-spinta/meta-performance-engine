import React, { useState } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [adAccountId, setAdAccountId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      setUser({ email });
      setLoading(false);
      setSuccess('Logged in successfully! Enter a Meta Ad Account ID to fetch campaigns.');
    }, 500);
  };

  const handleLogout = () => {
    setUser(null);
    setAdAccountId('');
    setCampaigns([]);
    setError('');
    setSuccess('');
  };

  const handleFetchCampaigns = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!adAccountId.trim()) {
      setError('Please enter an Ad Account ID');
      return;
    }

    setFetchLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/fetch-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adAccountId: adAccountId.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setSuccess(`✅ Fetched ${data.data?.length || 0} campaigns from Meta`);
      } else {
        setError(`Error: ${data.error || 'Failed to fetch campaigns'}`);
        setCampaigns([]);
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
      setCampaigns([]);
    } finally {
      setFetchLoading(false);
    }
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
            Meta Performance
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6', margin: '0 0 32px' }}>
            Engine
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 24px', lineHeight: '1.6' }}>
            Real-time Meta Ads analytics powered by Claude AI + Meta MCP
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '24px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            margin: '20px 0 0'
          }}>
            Demo: test@example.com / password123
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          borderBottom: '1px solid #334155',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              Meta Performance Engine
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '8px 0 0' }}>
              Fetching real-time campaign data via Claude + Meta MCP
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: '#7f1d1d',
            border: '1px solid #dc2626',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#1e3a1f',
            border: '1px solid #22c55e',
            color: '#86efac',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {/* Input Form */}
        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #334155',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
            Fetch Campaigns
          </h2>
          <form onSubmit={handleFetchCampaigns} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="Enter Meta Ad Account ID (e.g., 690235150132517)"
              style={{
                flex: 1,
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              disabled={fetchLoading}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: fetchLoading ? 'not-allowed' : 'pointer',
                opacity: fetchLoading ? 0.7 : 1,
                fontSize: '14px'
              }}
            >
              {fetchLoading ? 'Fetching...' : 'Fetch Campaigns'}
            </button>
          </form>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '12px 0 0',
            lineHeight: '1.5'
          }}>
            💡 Enter your Meta ad account ID to fetch all campaigns. The data is fetched in real-time from Meta Ads via Claude AI.
          </p>
        </div>

        {/* Campaigns Table */}
        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #334155'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
            Campaigns ({campaigns.length})
          </h2>

          {campaigns.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                fontSize: '14px',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}>
                      Campaign Name
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}>
                      Objective
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}>
                      Campaign ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#e2e8f0' }}>
                        {campaign.name}
                      </td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>
                        {campaign.objective || 'N/A'}
                      </td>
                      <td style={{
                        padding: '12px',
                        color: campaign.status === 'ACTIVE' ? '#86efac' : '#fca5a5'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: campaign.status === 'ACTIVE' ? '#1e3a1f' : '#7f1d1d',
                          border: campaign.status === 'ACTIVE' ? '1px solid #22c55e' : '1px solid #dc2626'
                        }}>
                          {campaign.status}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        color: '#64748b',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}>
                        {campaign.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', margin: 0 }}>
              {fetchLoading ? 'Loading campaigns...' : 'No campaigns fetched yet. Enter an account ID and click "Fetch Campaigns".'}
            </p>
          )}
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center',
          margin: '40px 0 0'
        }}>
          Backend: {API_URL} | Meta MCP: https://mcp.facebook.com/ads
        </p>
      </div>
    </div>
  );
}
