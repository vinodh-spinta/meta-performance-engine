import React, { useState } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adAccountId, setAdAccountId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = () => {
    setLoggedIn(true);
    setSuccess('✅ Logged in successfully!');
    setError('');
  };

  const handleLogout = () => {
    setLoggedIn(false);
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

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId: adAccountId.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setSuccess(`✅ Fetched ${data.count} campaigns from Meta!`);
      } else {
        setError(`Failed: ${data.error}`);
        setCampaigns([]);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // LOGIN SCREEN
  if (!loggedIn) {
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
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
            Meta Performance
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6', margin: '0 0 32px' }}>
            Engine
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px', lineHeight: '1.6' }}>
            Real-time Meta Ads analytics for Spinta Digital. Access real campaign data instantly.
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              marginBottom: '16px'
            }}
          >
            🚀 Access Dashboard
          </button>

          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: 0
          }}>
            Secure connection to Meta Ads Manager
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
              Real-time Meta Ads Analytics
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
              fontWeight: '600'
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
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Loading...' : 'Fetch Campaigns'}
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
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>
                      Campaign Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>
                      Objective
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>
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
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                        {campaign.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', margin: 0 }}>
              {loading ? 'Loading campaigns...' : 'Enter an account ID and click "Fetch Campaigns"'}
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
          Connected to Meta Ads Manager | Real-time data
        </p>
      </div>
    </div>
  );
}
