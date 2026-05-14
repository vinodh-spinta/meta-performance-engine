import React, { useState, useEffect } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Campaigns state
  const [adAccountId, setAdAccountId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // On mount, check if we have OAuth code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (code) {
      console.log('OAuth code received, exchanging for token...');
      handleOAuthCallback(code);
    } else if (error) {
      setError(`OAuth Error: ${params.get('error_reason')}`);
    } else {
      // Get login URL
      fetchLoginUrl();
    }
  }, []);

  const fetchLoginUrl = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login-url`);
      const data = await response.json();
      if (data.success) {
        setLoginUrl(data.loginUrl);
      }
    } catch (err) {
      console.error('Error fetching login URL:', err);
      setError('Failed to load login');
    }
  };

  const handleOAuthCallback = async (code) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (data.success) {
        setUser({
          name: data.user.name,
          email: data.user.email,
          accessToken: data.accessToken
        });
        setSuccess(`✅ Logged in as ${data.user.name}!`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError(`Login failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adAccountId: adAccountId.trim(),
          accessToken: user.accessToken
        })
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setSuccess(`✅ Fetched ${data.data?.length || 0} campaigns`);
      } else {
        setError(`Failed to fetch: ${data.error}`);
        setCampaigns([]);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAdAccountId('');
    setCampaigns([]);
    setError('');
    setSuccess('');
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
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
            Meta Performance
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6', margin: '0 0 32px' }}>
            Engine
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 32px', lineHeight: '1.6' }}>
            Real-time Meta Ads analytics. Secure OAuth login with your Meta account.
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#64748b' }}>Logging in with Meta...</p>
            </div>
          ) : loginUrl ? (
            <a
              href={loginUrl}
              style={{
                display: 'inline-block',
                width: '100%',
                padding: '12px',
                background: '#1877f2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              🔐 Login with Meta
            </a>
          ) : (
            <button
              onClick={fetchLoginUrl}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Initialize Login
            </button>
          )}

          <p style={{
            fontSize: '11px',
            color: '#94a3b8',
            textAlign: 'center',
            margin: '24px 0 0'
          }}>
            Secure • OAuth Encrypted • Your data is protected
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
              Welcome, <strong>{user.name}</strong>
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
              placeholder="Enter Ad Account ID (e.g., 690235150132517)"
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
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>Objective</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#e2e8f0' }}>{c.name}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{c.objective || 'N/A'}</td>
                      <td style={{ padding: '12px', color: c.status === 'ACTIVE' ? '#86efac' : '#fca5a5' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: c.status === 'ACTIVE' ? '#1e3a1f' : '#7f1d1d',
                          border: c.status === 'ACTIVE' ? '1px solid #22c55e' : '1px solid #dc2626'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '11px' }}>{c.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', margin: 0 }}>
              {fetchLoading ? 'Loading...' : 'Enter account ID and fetch campaigns'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
