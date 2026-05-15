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
  const [sortBy, setSortBy] = useState('roas');

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

  const getPerformanceColor = (roas) => {
    const roasValue = parseFloat(roas) || 0;
    if (roasValue >= 2) return '#10b981'; // Green - Good
    if (roasValue >= 1) return '#f59e0b'; // Yellow - Medium
    return '#ef4444'; // Red - Poor
  };

  const getPerformanceLabel = (roas) => {
    const roasValue = parseFloat(roas) || 0;
    if (roasValue >= 2) return 'Excellent';
    if (roasValue >= 1) return 'Good';
    if (roasValue > 0) return 'Poor';
    return 'No Data';
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

  // Calculate summary metrics
  const calculateSummary = () => {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalPurchases = 0;
    let totalPurchaseValue = 0;
    let activeCampaignsCount = 0;

    filteredCampaigns.forEach(campaign => {
      if (campaignMetrics[campaign.id]) {
        const metrics = campaignMetrics[campaign.id];
        totalSpend += parseFloat(metrics.spend || 0);
        totalImpressions += parseInt(metrics.impressions || 0);
        totalPurchases += parseInt(metrics.purchases || 0);
        totalPurchaseValue += parseFloat(metrics.purchaseValue || 0);
      }
      if (campaign.status === 'ACTIVE') {
        activeCampaignsCount++;
      }
    });

    const avgROAS = totalSpend > 0 ? (totalPurchaseValue / totalSpend).toFixed(2) : 0;

    return { totalSpend, totalImpressions, totalPurchases, totalPurchaseValue, avgROAS, activeCampaignsCount };
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
            Real-time Meta Ads analytics for Spinta Digital. Securely connect with your Meta account.
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

  const summary = calculateSummary();

  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100vh',
      color: '#fff',
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
          paddingBottom: '20px',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
              📊 Meta Performance Engine
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
              Real-time analytics for {selectedAccount ? adAccounts.find(a => a.id === selectedAccount)?.name : 'your campaigns'}
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

        {/* Account Selector */}
        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            Select Ad Account
          </label>
          <select
            value={selectedAccount}
            onChange={handleAccountChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              cursor: 'pointer'
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

        {/* Summary Dashboard */}
        {campaigns.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                  Total Spend
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {formatCurrency(summary.totalSpend)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {filteredCampaigns.length} campaigns
                </p>
              </div>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: 0.1,
                color: '#3b82f6'
              }}>
                💰
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                  Total Impressions
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>
                  {formatNumber(summary.totalImpressions)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Reach
                </p>
              </div>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: 0.1,
                color: '#60a5fa'
              }}>
                👁️
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                  Total Purchases
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {formatNumber(summary.totalPurchases)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Conversions
                </p>
              </div>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: 0.1,
                color: '#10b981'
              }}>
                🛒
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #292c1e 0%, #1e293b 100%)',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                  Avg ROAS
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                  {summary.avgROAS}x
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Return on Ad Spend
                </p>
              </div>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: 0.1,
                color: '#fbbf24'
              }}>
                ⭐
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {campaigns.length > 0 && (
          <div style={{
            background: '#1e293b',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #334155',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
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
                padding: '8px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <option value="roas">Sort: ROAS ⭐</option>
              <option value="purchases">Sort: Purchases</option>
              <option value="spend">Sort: Spend</option>
              <option value="impressions">Sort: Impressions</option>
              <option value="name">Sort: Name</option>
            </select>

            {expandedCampaign && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  {['today', 'yesterday', 'mtd', 'qtd', '7', '30', '90'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleDatePresetChange(preset)}
                      style={{
                        padding: '6px 12px',
                        background: dateRange === preset ? '#3b82f6' : '#334155',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : preset === 'mtd' ? 'MTD' : preset === 'qtd' ? 'QTD' : preset + 'D'}
                    </button>
                  ))}
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
              </>
            )}
          </div>
        )}

        {/* Custom Date Picker */}
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
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>From</label>
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
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>To</label>
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

        {/* Campaigns List */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px', color: '#e2e8f0' }}>
            Campaigns ({filteredCampaigns.length} of {campaigns.length})
          </h2>

          {filteredCampaigns.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
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
                        background: expandedCampaign === campaign.id ? '#0f172a' : '#1e293b',
                        border: expandedCampaign === campaign.id ? '2px solid #3b82f6' : '1px solid #334155',
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                            {campaign.name}
                          </h3>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: campaign.status === 'ACTIVE' ? '#1e3a1f' : '#3f3f3f',
                            border: campaign.status === 'ACTIVE' ? '1px solid #22c55e' : '1px solid #666',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: campaign.status === 'ACTIVE' ? '#86efac' : '#a3a3a3'
                          }}>
                            {campaign.status}
                          </span>
                        </div>

                        {metrics && (
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8' }}>Spend</p>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>
                                {formatCurrency(metrics.spend)}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8' }}>Impressions</p>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>
                                {formatNumber(metrics.impressions)}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8' }}>Purchases</p>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                                {formatNumber(metrics.purchases)}
                              </p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8' }}>ROAS</p>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: performanceColor }}>
                                {roas}x
                              </p>
                            </div>
                          </div>
                        )}

                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {campaign.objective} • {metrics ? `Performance: ${performanceLabel}` : 'Click to load metrics'}
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
                        borderLeft: '2px solid #3b82f6',
                        borderRight: '2px solid #3b82f6',
                        borderBottom: '2px solid #3b82f6',
                        marginTop: '-1px'
                      }}>
                        {metricsLoading ? (
                          <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                            Loading detailed metrics...
                          </p>
                        ) : metrics ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '16px'
                          }}>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Spend</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(metrics.spend)}</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Impressions</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#60a5fa' }}>{formatNumber(metrics.impressions)}</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Clicks</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>{formatNumber(metrics.clicks)}</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>CTR</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#a78bfa' }}>{(metrics.ctr || 0).toFixed(2)}%</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>CPC</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ec4899' }}>{formatCurrency(metrics.cpc)}</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Purchases</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{formatNumber(metrics.purchases)}</p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Purchase Value</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(metrics.purchaseValue)}</p>
                            </div>
                            <div style={{
                              background: '#1e293b',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '2px solid ' + performanceColor
                            }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>ROAS</p>
                              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: performanceColor }}>{metrics.roas}x</p>
                              <p style={{ margin: '4px 0 0', fontSize: '11px', color: performanceColor, fontWeight: '600' }}>{performanceLabel}</p>
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
                );
              })}
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
          🔐 Securely connected to Meta Ads Manager | Real-time data | Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
