import React, { useState, useEffect } from 'react';

// API URL - hardcoded for frontend (no dotenv needed)
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
  const [sortBy, setSortBy] = useState('roas');

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 'AUD': 'A$',
      'CAD': 'C$', 'JPY': '¥', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const getPerformanceColor = (roas) => {
    const roasValue = parseFloat(roas) || 0;
    if (roasValue >= 3) return '#8b5cf6'; // Purple - Exceptional
    if (roasValue >= 2) return '#10b981'; // Green - Excellent
    if (roasValue >= 1.5) return '#3b82f6'; // Blue - Good
    if (roasValue >= 1) return '#f59e0b'; // Amber - Fair
    if (roasValue > 0) return '#ef4444'; // Red - Poor
    return '#6b7280'; // Gray - No Data
  };

  const getPerformanceLabel = (roas) => {
    const roasValue = parseFloat(roas) || 0;
    if (roasValue >= 3) return '🌟 Exceptional';
    if (roasValue >= 2) return '✨ Excellent';
    if (roasValue >= 1.5) return '👍 Good';
    if (roasValue >= 1) return '⚠️ Fair';
    if (roasValue > 0) return '❌ Poor';
    return '📊 No Data';
  };

  const getDateRange = (preset) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const formatDate = (date) => date.toISOString().split('T')[0];

    return {
      'today': { start: formatDate(today), end: formatDate(today) },
      'yesterday': { start: formatDate(yesterday), end: formatDate(yesterday) },
      'mtd': { start: formatDate(monthStart), end: formatDate(today) },
      'qtd': { start: formatDate(quarterStart), end: formatDate(today) },
      '7': { days: 7 },
      '30': { days: 30 },
      '90': { days: 90 }
    }[preset];
  };

  const sortCampaigns = (campaignsToSort) => {
    const sorted = [...campaignsToSort];
    switch (sortBy) {
      case 'roas':
        sorted.sort((a, b) => (campaignMetrics[b.id]?.roas || 0) - (campaignMetrics[a.id]?.roas || 0));
        break;
      case 'purchases':
        sorted.sort((a, b) => (campaignMetrics[b.id]?.purchases || 0) - (campaignMetrics[a.id]?.purchases || 0));
        break;
      case 'spend':
        sorted.sort((a, b) => parseFloat(campaignMetrics[b.id]?.spend || 0) - parseFloat(campaignMetrics[a.id]?.spend || 0));
        break;
      case 'impressions':
        sorted.sort((a, b) => (campaignMetrics[b.id]?.impressions || 0) - (campaignMetrics[a.id]?.impressions || 0));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let filtered = campaigns;
    if (showActiveOnly) {
      filtered = filtered.filter(c => c.status === 'ACTIVE');
    }
    filtered = sortCampaigns(filtered);
    setFilteredCampaigns(filtered);
  }, [campaigns, showActiveOnly, sortBy, campaignMetrics]);
  /* eslint-enable react-hooks/exhaustive-deps */

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
        setSuccess(`✅ Loaded ${data.count} campaigns`);
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
        body: JSON.stringify({ campaignId, accessToken: token, dateStart, dateEnd })
      });
      const data = await response.json();
      if (data.success) {
        setCampaignMetrics(prev => ({ ...prev, [campaignId]: data.data }));
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
        setSuccess(`✅ Found ${data.count} ad accounts`);
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
      setSuccess('✅ Logged in successfully');
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
    setSortBy('roas');
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
    setSortBy('roas');
  };

  const formatCurrency = (value) => {
    return `${getCurrencySymbol(selectedAccountCurrency)}${parseFloat(value).toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return parseInt(value || 0).toLocaleString();
  };

  const calculateSummary = () => {
    let totalSpend = 0, totalImpressions = 0, totalPurchases = 0, totalPurchaseValue = 0;
    filteredCampaigns.forEach(campaign => {
      if (campaignMetrics[campaign.id]) {
        const m = campaignMetrics[campaign.id];
        totalSpend += parseFloat(m.spend || 0);
        totalImpressions += parseInt(m.impressions || 0);
        totalPurchases += parseInt(m.purchases || 0);
        totalPurchaseValue += parseFloat(m.purchaseValue || 0);
      }
    });
    const avgROAS = totalSpend > 0 ? (totalPurchaseValue / totalSpend).toFixed(2) : 0;
    return { totalSpend, totalImpressions, totalPurchases, totalPurchaseValue, avgROAS };
  };

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px' }}>
            Meta Performance
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#667eea', margin: '0 0 24px' }}>
            Engine
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 32px', lineHeight: '1.6' }}>
            Professional Meta Ads analytics for Spinta Digital
          </p>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          {error && <p style={{ fontSize: '12px', color: '#dc2626', margin: '16px 0 0', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  return (
    <div style={{
      background: '#f9fafb',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
              📊 Meta Performance Engine
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0' }}>
              Advanced analytics dashboard
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

        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{success}</div>}

        {/* Account Selector */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
            📍 Select Ad Account
          </label>
          <select
            value={selectedAccount}
            onChange={handleAccountChange}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#1f2937',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <option value="">Choose an ad account...</option>
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency || 'USD'})
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        {campaigns.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {[
              { label: 'Total Spend', value: formatCurrency(summary.totalSpend), color: '#3b82f6', icon: '💰' },
              { label: 'Impressions', value: formatNumber(summary.totalImpressions), color: '#8b5cf6', icon: '👁️' },
              { label: 'Purchases', value: formatNumber(summary.totalPurchases), color: '#10b981', icon: '🛒' },
              { label: 'Avg ROAS', value: summary.avgROAS + 'x', color: '#f59e0b', icon: '⭐' }
            ].map((card, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700' }}>{card.label}</p>
                  <span style={{ fontSize: '28px' }}>{card.icon}</span>
                </div>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {campaigns.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
              Active Only
            </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#1f2937',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              <option value="roas">Sort: ROAS ⭐</option>
              <option value="purchases">Sort: Purchases</option>
              <option value="spend">Sort: Spend</option>
              <option value="impressions">Sort: Impressions</option>
              <option value="name">Sort: Name</option>
            </select>

            {expandedCampaign && (
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                {['today', 'yesterday', 'mtd', 'qtd', '7', '30', '90'].map(preset => (
                  <button key={preset} onClick={() => handleDatePresetChange(preset)} style={{
                    padding: '6px 12px',
                    background: dateRange === preset ? '#667eea' : '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: dateRange === preset ? 'white' : '#1f2937',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : preset === 'mtd' ? 'MTD' : preset === 'qtd' ? 'QTD' : preset + 'D'}
                  </button>
                ))}
                <button onClick={() => setShowCustomDatePicker(!showCustomDatePicker)} style={{
                  padding: '6px 12px',
                  background: dateRange === 'custom' ? '#667eea' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: dateRange === 'custom' ? 'white' : '#1f2937',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  📅 Custom
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: '600' }}>From</label>
              <input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)} style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#1f2937', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: '600' }}>To</label>
              <input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)} style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#1f2937', fontSize: '14px' }} />
            </div>
            <button onClick={handleCustomDateApply} style={{
              padding: '8px 16px',
              background: '#667eea',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}>Apply</button>
          </div>
        )}

        {/* Campaigns Grid */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px', color: '#1f2937' }}>
            Campaigns ({filteredCampaigns.length} of {campaigns.length})
          </h2>
          {filteredCampaigns.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredCampaigns.map((campaign) => {
                const metrics = campaignMetrics[campaign.id];
                const roas = metrics?.roas || 0;
                const performanceColor = getPerformanceColor(roas);
                const performanceLabel = getPerformanceLabel(roas);

                return (
                  <div key={campaign.id}>
                    <div
                      onClick={() => handleCampaignClick(campaign)}
                      style={{
                        background: 'white',
                        border: expandedCampaign === campaign.id ? '2px solid #667eea' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s',
                        boxShadow: expandedCampaign === campaign.id ? '0 4px 12px rgba(102, 126, 234, 0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                        backgroundColor: expandedCampaign === campaign.id ? '#f0f4ff' : 'white'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                            {campaign.name}
                          </h3>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: campaign.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                            border: campaign.status === 'ACTIVE' ? '1px solid #6ee7b7' : '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: campaign.status === 'ACTIVE' ? '#047857' : '#6b7280'
                          }}>
                            {campaign.status}
                          </span>
                        </div>

                        {metrics && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '8px' }}>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Spend</p>
                              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(metrics.spend)}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Impressions</p>
                              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>{formatNumber(metrics.impressions)}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Purchases</p>
                              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{formatNumber(metrics.purchases)}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>ROAS</p>
                              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: performanceColor }}>{roas}x</p>
                            </div>
                          </div>
                        )}

                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                          {campaign.objective} • {metrics ? performanceLabel : 'Click to load metrics'}
                        </p>
                      </div>

                      <span style={{
                        fontSize: '20px',
                        color: '#667eea',
                        transform: expandedCampaign === campaign.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }}>
                        ▼
                      </span>
                    </div>

                    {expandedCampaign === campaign.id && (
                      <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '0 0 12px 12px',
                        borderLeft: '2px solid #667eea',
                        borderRight: '2px solid #667eea',
                        borderBottom: '2px solid #667eea',
                        marginTop: '-1px'
                      }}>
                        {metricsLoading ? (
                          <p style={{ color: '#9ca3af', textAlign: 'center', margin: 0 }}>Loading detailed metrics...</p>
                        ) : metrics ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            {[
                              { label: 'Spend', value: formatCurrency(metrics.spend), color: '#3b82f6' },
                              { label: 'Impressions', value: formatNumber(metrics.impressions), color: '#8b5cf6' },
                              { label: 'Clicks', value: formatNumber(metrics.clicks), color: '#06b6d4' },
                              { label: 'CTR', value: (metrics.ctr || 0).toFixed(2) + '%', color: '#f59e0b' },
                              { label: 'CPC', value: formatCurrency(metrics.cpc), color: '#ec4899' },
                              { label: 'Purchases', value: formatNumber(metrics.purchases), color: '#10b981' },
                              { label: 'Purchase Value', value: formatCurrency(metrics.purchaseValue), color: '#10b981' },
                              { label: 'ROAS', value: metrics.roas + 'x', color: performanceColor, highlight: true }
                            ].map((item, i) => (
                              <div key={i} style={{
                                background: '#f9fafb',
                                padding: '16px',
                                borderRadius: '8px',
                                border: item.highlight ? `2px solid ${performanceColor}` : '1px solid #e5e7eb'
                              }}>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: item.color }}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#9ca3af', textAlign: 'center', margin: 0 }}>No metrics available</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px', margin: 0 }}>
              {loading ? 'Loading campaigns...' : campaigns.length === 0 ? 'Select an ad account to view campaigns.' : 'No campaigns match your filters.'}
            </p>
          )}
        </div>

        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '40px 0 0'
        }}>
          🔐 Securely connected | Real-time data | Updated {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
