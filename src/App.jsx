import React, { useState, useEffect } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [campaignMetrics, setCampaignMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days

  const fetchCampaigns = async (accountId, token) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Remove 'act_' prefix if present
      const cleanAccountId = accountId.replace('act_', '');
      
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId: cleanAccountId, accessToken: token })
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setSuccess(`✅ Fetched ${data.count} campaigns!`);
      } else {
        setError(`Failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignMetrics = async (campaignId, token, days) => {
    setMetricsLoading(true);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      const dateStart = startDate.toISOString().split('T')[0];
      const dateEnd = endDate.toISOString().split('T')[0];

      const response = await fetch(`${API_URL}/api/campaign-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: campaignId, 
          accessToken: token,
          dateStart: dateStart,
          dateEnd: dateEnd
        })
      });

      const data = await response.json();

      if (data.success) {
        setCampaignMetrics(prev => ({
          ...prev,
          [campaignId]: data.data
        }));
      } else {
        setError(`Failed to load metrics: ${data.error}`);
      }
    } catch (err) {
      setError(`Error loading metrics: ${err.message}`);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleCampaignClick = (campaign) => {
    if (expandedCampaign === campaign.id) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaign.id);
      if (!campaignMetrics[campaign.id]) {
        fetchCampaignMetrics(campaign.id, accessToken, parseInt(dateRange));
      }
    }
  };

  const handleDateRangeChange = (days) => {
    setDateRange(days);
    if (expandedCampaign) {
      fetchCampaignMetrics(expandedCampaign, accessToken, parseInt(days));
    }
  };

  const fetchAdAccounts = React.useCallback(async (token) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/ad-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      });

      const data = await response.json();

      if (data.success) {
        setAdAccounts(data.data || []);
        setSuccess(`✅ Found ${data.count} ad accounts!`);
        if (data.data && data.data.length > 0) {
          setSelectedAccount(data.data[0].id);
          fetchCampaigns(data.data[0].id.replace('act_', ''), token);
        }
      } else {
        setError(`Failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorMsg = params.get('error');

    if (token) {
      setAccessToken(token);
      setLoggedIn(true);
      setSuccess('✅ Logged in successfully!');
      fetchAdAccounts(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorMsg) {
      setError(`OAuth error: ${errorMsg}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchAdAccounts]);

  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccount(accountId);
    setCampaignMetrics({});
    setExpandedCampaign(null);
    if (accessToken) {
      fetchCampaigns(accountId, accessToken);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login-url`);
      const data = await response.json();
      if (data.success) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setAccessToken('');
    setAdAccounts([]);
    setSelectedAccount('');
    setCampaigns([]);
    setCampaignMetrics({});
    setExpandedCampaign(null);
    setError('');
    setSuccess('');
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return parseInt(value || 0).toLocaleString();
  };

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
            Real-time Meta Ads analytics for Spinta Digital. Securely connect with your Meta account to view all your ad accounts and campaigns.
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
              fontSize: '16px'
            }}
          >
            🔐 Login with Meta
          </button>

          {error && (
            <p style={{
              fontSize: '12px',
              color: '#dc2626',
              margin: '16px 0 0',
              background: '#fee2e2',
              padding: '8px',
              borderRadius: '6px'
            }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              Real-time Meta Ads Campaign Analytics
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

        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #334155',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
            Select Ad Account
          </h2>
          <select
            value={selectedAccount}
            onChange={handleAccountChange}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">Choose an ad account...</option>
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.business_name || 'N/A'})
              </option>
            ))}
          </select>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '12px 0 0',
            lineHeight: '1.5'
          }}>
            💡 Select an ad account to view its campaigns and performance metrics.
          </p>
        </div>

        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              Campaigns ({campaigns.length})
            </h2>
            {expandedCampaign && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDateRangeChange('7')}
                  style={{
                    padding: '6px 12px',
                    background: dateRange === '7' ? '#3b82f6' : '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  7D
                </button>
                <button
                  onClick={() => handleDateRangeChange('30')}
                  style={{
                    padding: '6px 12px',
                    background: dateRange === '30' ? '#3b82f6' : '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  30D
                </button>
                <button
                  onClick={() => handleDateRangeChange('90')}
                  style={{
                    padding: '6px 12px',
                    background: dateRange === '90' ? '#3b82f6' : '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  90D
                </button>
              </div>
            )}
          </div>

          {campaigns.length > 0 ? (
            <div>
              {campaigns.map((campaign) => (
                <div key={campaign.id} style={{ marginBottom: '12px' }}>
                  <div
                    onClick={() => handleCampaignClick(campaign)}
                    style={{
                      background: expandedCampaign === campaign.id ? '#0f172a' : '#334155',
                      padding: '16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: expandedCampaign === campaign.id ? '1px solid #3b82f6' : '1px solid #334155',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                        {campaign.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {campaign.objective} • {campaign.status}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '20px',
                      color: '#3b82f6',
                      transform: expandedCampaign === campaign.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}>
                      ▼
                    </span>
                  </div>

                  {expandedCampaign === campaign.id && (
                    <div style={{
                      background: '#0f172a',
                      padding: '20px',
                      borderRadius: '0 0 8px 8px',
                      borderLeft: '1px solid #3b82f6',
                      borderRight: '1px solid #3b82f6',
                      borderBottom: '1px solid #3b82f6',
                      marginTop: '-1px'
                    }}>
                      {metricsLoading ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                          Loading metrics...
                        </p>
                      ) : campaignMetrics[campaign.id] ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '16px'
                        }}>
                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              Spend
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>
                              {formatCurrency(campaignMetrics[campaign.id].spend)}
                            </p>
                          </div>

                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              Impressions
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>
                              {formatNumber(campaignMetrics[campaign.id].impressions)}
                            </p>
                          </div>

                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              Clicks
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                              {formatNumber(campaignMetrics[campaign.id].clicks)}
                            </p>
                          </div>

                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              CTR
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#a78bfa' }}>
                              {(campaignMetrics[campaign.id].ctr || 0).toFixed(2)}%
                            </p>
                          </div>

                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              CPC
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ec4899' }}>
                              {formatCurrency(campaignMetrics[campaign.id].cpc)}
                            </p>
                          </div>

                          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                              Conversions
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#06b6d4' }}>
                              {formatNumber(campaignMetrics[campaign.id].conversions)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                          No metrics available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', margin: 0 }}>
              {loading ? 'Loading campaigns...' : 'Select an ad account to view campaigns.'}
            </p>
          )}
        </div>

        <p style={{
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center',
          margin: '40px 0 0'
        }}>
          🔐 Securely connected to Meta Ads Manager | Real-time data
        </p>
      </div>
    </div>
  );
}
