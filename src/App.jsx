import React, { useState, useEffect } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedAccountCurrency, setSelectedAccountCurrency] = useState('USD');
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [campaignMetrics, setCampaignMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, roas, purchases, spend, impressions

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'AUD': 'A$',
      'CAD': 'C$',
      'JPY': '¥',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const isEcommerceCampaign = (objective) => {
    const ecommerceObjectives = [
      'SALES',
      'PRODUCT_CATALOG_SALES',
      'CONVERSIONS'
    ];
    return ecommerceObjectives.includes(objective);
  };

  const isLeadGenCampaign = (objective) => {
    const leadObjectives = [
      'LEAD_GENERATION',
      'MESSAGES'
    ];
    return leadObjectives.includes(objective);
  };

  const getDateRange = (preset) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const ranges = {
      'today': { start: formatDate(today), end: formatDate(today) },
      'yesterday': { start: formatDate(yesterday), end: formatDate(yesterday) },
      'mtd': { start: formatDate(monthStart), end: formatDate(today) },
      'qtd': { start: formatDate(quarterStart), end: formatDate(today) },
      '7': { days: 7 },
      '30': { days: 30 },
      '90': { days: 90 }
    };

    return ranges[preset];
  };

  const sortCampaigns = (campaignsToSort) => {
    const sorted = [...campaignsToSort];

    switch (sortBy) {
      case 'roas':
        sorted.sort((a, b) => {
          const roasA = campaignMetrics[a.id]?.roas || 0;
          const roasB = campaignMetrics[b.id]?.roas || 0;
          return parseFloat(roasB) - parseFloat(roasA);
        });
        break;
      case 'purchases':
        sorted.sort((a, b) => {
          const purchasesA = campaignMetrics[a.id]?.purchases || 0;
          const purchasesB = campaignMetrics[b.id]?.purchases || 0;
          return purchasesB - purchasesA;
        });
        break;
      case 'spend':
        sorted.sort((a, b) => {
          const spendA = campaignMetrics[a.id]?.spend || 0;
          const spendB = campaignMetrics[b.id]?.spend || 0;
          return parseFloat(spendB) - parseFloat(spendA);
        });
        break;
      case 'impressions':
        sorted.sort((a, b) => {
          const impA = campaignMetrics[a.id]?.impressions || 0;
          const impB = campaignMetrics[b.id]?.impressions || 0;
          return impB - impA;
        });
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  };

  const applyFiltersAndSort = (campaignsToFilter) => {
    let filtered = campaignsToFilter;

    // Filter active campaigns
    if (showActiveOnly) {
      filtered = filtered.filter(c => c.status === 'ACTIVE');
    }

    // Apply sorting
    filtered = sortCampaigns(filtered);

    setFilteredCampaigns(filtered);
  };

  useEffect(() => {
    applyFiltersAndSort(campaigns);
  }, [campaigns, showActiveOnly, sortBy, campaignMetrics, applyFiltersAndSort]);

  const fetchCampaigns = async (accountId, token) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanAccountId = accountId.replace('act_', '');
      
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId: cleanAccountId, accessToken: token })
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setCampaignMetrics({});
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

  const fetchCampaignMetrics = async (campaignId, token, dateStart, dateEnd) => {
    setMetricsLoading(true);

    try {
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
        const range = getDateRange(dateRange);
        let start, end;
        if (range.days) {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000);
          start = startDate.toISOString().split('T')[0];
          end = endDate.toISOString().split('T')[0];
        } else {
          start = range.start;
          end = range.end;
        }
        fetchCampaignMetrics(campaign.id, accessToken, start, end);
      }
    }
  };

  const handleDatePresetChange = (preset) => {
    setDateRange(preset);
    setShowCustomDatePicker(false);
    if (expandedCampaign) {
      const range = getDateRange(preset);
      let start, end;
      if (range.days) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000);
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
      } else {
        start = range.start;
        end = range.end;
      }
      fetchCampaignMetrics(expandedCampaign, accessToken, start, end);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateStart && customDateEnd) {
      setDateRange('custom');
      if (expandedCampaign) {
        fetchCampaignMetrics(expandedCampaign, accessToken, customDateStart, customDateEnd);
      }
      setShowCustomDatePicker(false);
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
          setSelectedAccountCurrency(data.data[0].currency || 'USD');
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
    const account = adAccounts.find(a => a.id === accountId);
    setSelectedAccount(accountId);
    setSelectedAccountCurrency(account?.currency || 'USD');
    setCampaignMetrics({});
    setExpandedCampaign(null);
    setShowActiveOnly(false);
    setSortBy('name');
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
    setSelectedAccountCurrency('USD');
    setCampaigns([]);
    setFilteredCampaigns([]);
    setCampaignMetrics({});
    setExpandedCampaign(null);
    setError('');
    setSuccess('');
    setShowActiveOnly(false);
    setSortBy('name');
  };

  const formatCurrency = (value) => {
    return `${getCurrencySymbol(selectedAccountCurrency)}${parseFloat(value).toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return parseInt(value || 0).toLocaleString();
  };

  const renderMetricCard = (label, value, color, unit = '') => {
    return (
      <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: color }}>
          {value}{unit}
        </p>
      </div>
    );
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
                {account.name} ({account.currency || 'USD'}) - {account.business_name || 'N/A'}
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
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              Campaigns ({filteredCampaigns.length} of {campaigns.length})
            </h2>
            {campaigns.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>Active Only</span>
                </label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <option value="name">Sort by Name</option>
                  <option value="roas">Sort by ROAS ⭐</option>
                  <option value="purchases">Sort by Purchases</option>
                  <option value="spend">Sort by Spend</option>
                  <option value="impressions">Sort by Impressions</option>
                </select>
              </div>
            )}
          </div>

          {expandedCampaign && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
              padding: '12px',
              background: '#0f172a',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => handleDatePresetChange('today')}
                style={{
                  padding: '6px 12px',
                  background: dateRange === 'today' ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Today
              </button>
              <button
                onClick={() => handleDatePresetChange('yesterday')}
                style={{
                  padding: '6px 12px',
                  background: dateRange === 'yesterday' ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDatePresetChange('mtd')}
                style={{
                  padding: '6px 12px',
                  background: dateRange === 'mtd' ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                MTD
              </button>
              <button
                onClick={() => handleDatePresetChange('qtd')}
                style={{
                  padding: '6px 12px',
                  background: dateRange === 'qtd' ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                QTD
              </button>
              <button
                onClick={() => handleDatePresetChange('7')}
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
                onClick={() => handleDatePresetChange('30')}
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
                onClick={() => handleDatePresetChange('90')}
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
              <button
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                style={{
                  padding: '6px 12px',
                  background: dateRange === 'custom' ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                📅 Custom
              </button>
            </div>
          )}

          {showCustomDatePicker && (
            <div style={{
              background: '#0f172a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  From
                </label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  style={{
                    padding: '8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  To
                </label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  style={{
                    padding: '8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleCustomDateApply}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px'
                }}
              >
                Apply
              </button>
            </div>
          )}

          {filteredCampaigns.length > 0 ? (
            <div>
              {filteredCampaigns.map((campaign) => (
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
                        {campaignMetrics[campaign.id]?.roas && (
                          <span style={{ color: '#fbbf24', fontWeight: '700', marginLeft: '8px' }}>
                            ROAS: {campaignMetrics[campaign.id].roas}x
                          </span>
                        )}
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
                          {renderMetricCard('Spend', formatCurrency(campaignMetrics[campaign.id].spend), '#22c55e')}
                          {renderMetricCard('Impressions', formatNumber(campaignMetrics[campaign.id].impressions), '#60a5fa')}
                          {renderMetricCard('Clicks', formatNumber(campaignMetrics[campaign.id].clicks), '#f59e0b')}
                          {renderMetricCard('CTR', (campaignMetrics[campaign.id].ctr || 0).toFixed(2), '#a78bfa', '%')}
                          {renderMetricCard('CPC', formatCurrency(campaignMetrics[campaign.id].cpc), '#ec4899')}

                          {isEcommerceCampaign(campaign.objective) && (
                            <>
                              {renderMetricCard('Purchases', formatNumber(campaignMetrics[campaign.id].purchases), '#06b6d4')}
                              {renderMetricCard('Purchase Value', formatCurrency(campaignMetrics[campaign.id].purchaseValue), '#10b981')}
                              <div style={{ 
                                background: '#1e293b', 
                                padding: '12px', 
                                borderRadius: '6px',
                                border: '2px solid #fbbf24'
                              }}>
                                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                                  ROAS ⭐
                                </p>
                                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fbbf24' }}>
                                  {campaignMetrics[campaign.id].roas}x
                                </p>
                              </div>
                            </>
                          )}

                          {isLeadGenCampaign(campaign.objective) && (
                            <>
                              {renderMetricCard('Leads', formatNumber(campaignMetrics[campaign.id].purchases), '#06b6d4')}
                              {renderMetricCard('Cost Per Lead', formatCurrency(campaignMetrics[campaign.id].cpc), '#10b981')}
                            </>
                          )}
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
              {loading ? 'Loading campaigns...' : campaigns.length === 0 ? 'Select an ad account to view campaigns.' : 'No campaigns match your filters.'}
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
