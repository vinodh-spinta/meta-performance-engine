import React, { useState, useEffect } from 'react';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

// Skeleton Loader Component
const SkeletonLoader = ({ width = '100%', height = '24px', style = {} }) => (
  <div style={{
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
    width,
    height,
    borderRadius: '6px',
    ...style
  }} />
);

// Loading Spinner Component
const LoadingSpinner = ({ size = '40px', color = '#667eea' }) => (
  <div style={{
    width: size,
    height: size,
    border: `4px solid ${color}20`,
    borderTop: `4px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
);

// Creative-First Section Component
const CreativeSection = ({ adSet, campaign, isLeadGen, creativeMetrics, formatCurrency, formatNumber }) => {
  const [expandedCreative, setExpandedCreative] = useState(null);
  const [sortBy, setSortBy] = useState('spend');

  const creatives = adSet.creatives || [];

  // Sort creatives
  const sortedCreatives = [...creatives].sort((a, b) => {
    const metricsA = creativeMetrics[a.id] || {};
    const metricsB = creativeMetrics[b.id] || {};

    if (sortBy === 'spend') return (metricsB.spend || 0) - (metricsA.spend || 0);
    if (sortBy === 'impressions') return (metricsB.impressions || 0) - (metricsA.impressions || 0);
    if (sortBy === 'performance') {
      const perfA = isLeadGen ? (metricsA.leads || 0) : (metricsA.purchases || 0);
      const perfB = isLeadGen ? (metricsB.leads || 0) : (metricsB.purchases || 0);
      return perfB - perfA;
    }
    return 0;
  });

  return (
    <div style={{
      borderTop: '2px solid #e5e7eb',
      marginTop: '24px',
      paddingTop: '24px'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h4 style={{
            margin: '0 0 4px',
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            🎬 Creatives ({creatives.length})
          </h4>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {campaign.name} • {adSet.name}
          </p>
        </div>

        {/* Sort Options */}
        {creatives.length > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {['spend', 'impressions', 'performance'].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: sortBy === option ? '700' : '500',
                  background: sortBy === option ? '#667eea' : '#f3f4f6',
                  color: sortBy === option ? '#fff' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {option === 'spend' ? '💰 Spend' : option === 'impressions' ? '👁️ Views' : '⭐ Performance'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Creatives Grid - Card View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
        gap: '20px'
      }}>
        {sortedCreatives.map((creative) => {
          const metric = creativeMetrics[creative.id] || {
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            purchases: 0,
            purchaseValue: 0,
            roas: 0,
            leads: 0,
            cpl: 0,
            frequency: 0
          };

          const isExpanded = expandedCreative === creative.id;
          const perfScore = isLeadGen ? metric.leads : metric.purchases;

          // Performance color
          let perfColor = '#9ca3af';
          if (perfScore > 10) perfColor = '#10b981';
          else if (perfScore > 5) perfColor = '#f59e0b';
          else if (perfScore > 0) perfColor = '#ef4444';

          return (
            <div
              key={creative.id}
              onClick={() => setExpandedCreative(isExpanded ? null : creative.id)}
              style={{
                background: '#fff',
                border: isExpanded ? '2px solid #667eea' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded ? '0 10px 25px rgba(102, 126, 234, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Creative Type & Status Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: creative.creativeType === 'VIDEO' ? '#fef3c7' : '#dbeafe',
                    color: creative.creativeType === 'VIDEO' ? '#92400e' : '#075985',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {creative.creativeType === 'VIDEO' ? '🎥' : '🖼️'}
                    {creative.creativeType}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: creative.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                    color: creative.status === 'ACTIVE' ? '#047857' : '#6b7280',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {creative.status === 'ACTIVE' ? '✓' : '−'}
                    {creative.status}
                  </span>
                </div>

                {/* Performance Indicator */}
                <div style={{
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: perfColor
                  }}>
                    {perfScore}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    {isLeadGen ? 'Leads' : 'Conv'}
                  </div>
                </div>
              </div>

              {/* Creative Name/Title */}
              <div>
                <h3 style={{
                  margin: '0 0 8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#1f2937',
                  lineHeight: '1.4'
                }}>
                  {creative.name}
                </h3>
              </div>

              {/* Ad Copy - PROMINENT */}
              <div style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: '4px solid #667eea',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <p style={{
                  margin: '0',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  {creative.adCopy === 'No copy' ? (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No copy available</span>
                  ) : (
                    creative.adCopy.substring(0, 300) + (creative.adCopy.length > 300 ? '...' : '')
                  )}
                </p>
              </div>

              {/* Headline if available */}
              {creative.headline && (
                <div style={{
                  padding: '12px',
                  background: '#f0f4ff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#4f46e5',
                  borderLeft: '3px solid #4f46e5',
                  fontWeight: '500'
                }}>
                  <strong>Headline:</strong> {creative.headline}
                </div>
              )}

              {/* Key Metrics Row - Always Visible */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '2px solid #f3f4f6'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>SPEND</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                    ${(metric.spend || 0).toFixed(0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>IMPRESSIONS</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                    {(metric.impressions || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CTR</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#06b6d4' }}>
                    {(metric.ctr || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div style={{
                  paddingTop: '16px',
                  borderTop: '2px solid #f3f4f6',
                  animation: 'fadeIn 0.2s'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CLICKS</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                        {(metric.clicks || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>CPC</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                        ${(metric.cpc || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>FREQUENCY</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                        {(metric.frequency || 0).toFixed(2)}x
                      </div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
                        {isLeadGen ? 'CPL' : 'ROAS'}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                        {isLeadGen ? `$${(metric.cpl || 0).toFixed(2)}` : `${(metric.roas || 0).toFixed(2)}x`}
                      </div>
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div style={{
                    padding: '12px',
                    background: '#f0f4ff',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#4f46e5',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    ↑ Click to collapse • 🚀 More features coming soon
                  </div>
                </div>
              )}

              {/* Hover Hint */}
              {!isExpanded && (
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Click to expand details
                </div>
              )}
            </div>
          );
        })}
      </div>

      {creatives.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '8px',
          color: '#9ca3af'
        }}>
          No creatives found
        </div>
      )}

      {/* Future Features Placeholder */}
      {creatives.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: '#f0f4ff',
          borderRadius: '8px',
          borderLeft: '4px solid #667eea',
          fontSize: '12px',
          color: '#4f46e5'
        }}>
          <strong>🚀 Coming Soon:</strong> Video previews • A/B test insights • Trend charts • AI recommendations • Audience breakdown
        </div>
      )}
    </div>
  );
};

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
  const [dateRange, setDateRange] = useState('30');
  const [loggingIn, setLoggingIn] = useState(false);

  // Stage 3B - Ad Sets
  const [expandedCreatives, setExpandedCreatives] = useState(null);
  const [adSets, setAdSets] = useState({});
  const [adSetMetrics, setAdSetMetrics] = useState({});
  const [adSetsLoading, setAdSetsLoading] = useState({});

  // Stage 3C - Creatives (pulled with ad sets, metrics only)
  const [creativeMetrics, setCreativeMetrics] = useState({});

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 'AUD': 'A$',
      'CAD': 'C$', 'SGD': 'S$', 'HKD': 'HK$', 'JPY': '¥', 'CNY': '¥',
      'AED': 'د.إ', 'SAR': '﷼'
    };
    return symbols[currency] || '$';
  };

  const formatCurrency = (value) => {
    const symbol = getCurrencySymbol(selectedAccountCurrency);
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
    return `${symbol}${value.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num);
  };

  const getPerformanceColor = (objective, metric) => {
    let perfValue = 0;
    if (objective && (objective.includes('LEAD') || objective.includes('lead'))) {
      perfValue = metric.leads || 0;
    } else {
      perfValue = metric.purchases || 0;
    }
    if (perfValue > 10) return '#10b981';
    if (perfValue > 5) return '#f59e0b';
    if (perfValue > 0) return '#ef4444';
    return '#9ca3af';
  };

  const getDateRange = (range) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'today':
        startDate.setDate(endDate.getDate());
        break;
      case 'yesterday':
        startDate.setDate(endDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'mtd':
        startDate.setDate(1);
        break;
      case 'qtd':
        const quarter = Math.floor(startDate.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        break;
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days: range === '7' ? 7 : range === '30' ? 30 : range === '90' ? 90 : null
    };
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setAccessToken(token);
      setLoggedIn(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      const response = await fetch(`${API_URL}/api/auth/login-url`);
      const data = await response.json();
      if (data.success && data.loginUrl) {
        window.location.href = data.loginUrl;
      }
    } catch (err) {
      setError('Failed to initiate login');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setAccessToken('');
    setSelectedAccount('');
    setAdAccounts([]);
    setSelectedAccountCurrency('USD');
    setCampaigns([]);
    setFilteredCampaigns([]);
    setCampaignMetrics({});
    setExpandedCampaign(null);
    setExpandedCreatives(null);
    setAdSets({});
    setAdSetMetrics({});
    setCreativeMetrics({});
    setError('');
    setSuccess('');
  };

  const fetchAdAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ad-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });

      const data = await response.json();
      if (data.success) {
        setAdAccounts(data.data || []);
        setSuccess('Ad accounts fetched');
      }
    } catch (err) {
      setError('Failed to fetch ad accounts');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    if (loggedIn && accessToken) {
      fetchAdAccounts();
    }
  }, [loggedIn, accessToken, fetchAdAccounts]);

  const fetchCampaigns = async (accountId) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId: accountId, accessToken })
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data || []);
        setFilteredCampaigns(data.data || []);
        setSuccess(`${data.count} campaigns loaded`);
      } else {
        setError(data.error || 'Failed to fetch campaigns');
      }
    } catch (err) {
      setError('Failed to fetch campaigns: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignMetrics = React.useCallback(async (campaignIds) => {
    try {
      const getRange = getDateRange(dateRange);
      const { start, end } = getRange;

      const metricsMap = {};
      const promises = campaignIds.map(async (campaignId) => {
        try {
          const response = await fetch(`${API_URL}/api/campaign-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId, accessToken, dateStart: start, dateEnd: end })
          });

          const data = await response.json();
          if (data.success) {
            metricsMap[campaignId] = data.data;
          } else {
            metricsMap[campaignId] = {
              spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
              purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
            };
          }
        } catch {
          metricsMap[campaignId] = {
            spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
            purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
          };
        }
      });

      await Promise.all(promises);
      setCampaignMetrics(metricsMap);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  }, [dateRange, accessToken]);

  const fetchAdSets = async (campaignId) => {
    try {
      setAdSetsLoading(prev => ({ ...prev, [campaignId]: true }));
      const response = await fetch(`${API_URL}/api/ad-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, accessToken })
      });

      const data = await response.json();
      if (data.success) {
        setAdSets(prev => ({ ...prev, [campaignId]: data.data || [] }));
        fetchAdSetMetrics(data.data || [], campaignId);
      }
    } catch (err) {
      console.error('Error fetching ad sets:', err);
    } finally {
      setAdSetsLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const fetchAdSetMetrics = async (adSetArray, campaignId) => {
    try {
      const getRange = getDateRange(dateRange);
      const { start, end } = getRange;
      const metricsMap = {};

      const promises = adSetArray.map(async (adSet) => {
        try {
          const response = await fetch(`${API_URL}/api/adset-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adSetId: adSet.id, accessToken, dateStart: start, dateEnd: end })
          });

          const data = await response.json();
          if (data.success) {
            metricsMap[adSet.id] = data.data;
          } else {
            metricsMap[adSet.id] = {
              spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
              purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
            };
          }
        } catch {
          metricsMap[adSet.id] = {
            spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
            purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
          };
        }
      });

      await Promise.all(promises);
      setAdSetMetrics(prev => ({ ...prev, ...metricsMap }));
    } catch (err) {
      console.error('Error fetching ad set metrics:', err);
    }
  };

  const handleCampaignClick = (campaign) => {
    if (expandedCampaign === campaign.id) {
      setExpandedCampaign(null);
      setExpandedCreatives(null);
    } else {
      setExpandedCampaign(campaign.id);
      if (!adSets[campaign.id]) {
        fetchAdSets(campaign.id);
      }
    }
  };

  const handleAdSetClick = (adSetId) => {
    if (expandedCreatives === adSetId) {
      setExpandedCreatives(null);
    } else {
      setExpandedCreatives(adSetId);
    }
  };

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    if (selectedAccount && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id);
      fetchCampaignMetrics(campaignIds);
    }
  }, [dateRange, selectedAccount, campaigns, fetchCampaignMetrics]);

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  const handleAccountSelect = (accountId, currency) => {
    console.log(`📢 handleAccountSelect triggered:`, { accountId, currency });
    setSelectedAccount(accountId);
    setSelectedAccountCurrency(currency);
    console.log(`📢 Calling fetchCampaigns with accountId: ${accountId}`);
    fetchCampaigns(accountId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell"',
      padding: '0'
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: '700' }}>📊 Meta Performance Engine</h1>
        {loggedIn && (
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        )}
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {success}
          </div>
        )}

        {!loggedIn ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 12px' }}>Welcome to Meta Performance Engine</h2>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>Connect your Meta Ads account to view campaign analytics</p>
            </div>
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              style={{
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {loggingIn ? 'Connecting...' : 'Connect with Meta'}
            </button>
          </div>
        ) : (
          <div>
            {/* Account & Date Selector */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  console.log(`📝 Select changed to:`, e.target.value);
                  const selected = adAccounts.find(a => a.id === e.target.value);
                  console.log(`📝 Found account:`, selected);
                  if (selected) {
                    console.log(`✅ Calling handleAccountSelect`);
                    handleAccountSelect(selected.id, selected.currency);
                  } else {
                    console.log(`❌ Account not found in adAccounts`);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  flex: 1,
                  minWidth: '200px'
                }}
              >
                <option value="">Select Ad Account</option>
                {adAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['today', 'yesterday', 'mtd', 'qtd', '7', '30', '90'].map(range => (
                  <button
                    key={range}
                    onClick={() => handleDateRangeChange(range)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: dateRange === range ? '2px solid #667eea' : '1px solid #e5e7eb',
                      background: dateRange === range ? '#667eea' : 'white',
                      color: dateRange === range ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : range === 'mtd' ? 'MTD' : range === 'qtd' ? 'QTD' : `${range}D`}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaigns List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <LoadingSpinner />
              </div>
            ) : campaigns.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {filteredCampaigns.map(campaign => {
                  const isLeadGen = campaign.objective && (campaign.objective.includes('LEAD') || campaign.objective.includes('lead'));
                  const metric = campaignMetrics[campaign.id] || {};
                  const isExpanded = expandedCampaign === campaign.id;
                  const campaignAdSets = adSets[campaign.id] || [];

                  return (
                    <div
                      key={campaign.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div
                        onClick={() => handleCampaignClick(campaign)}
                        style={{
                          padding: '20px',
                          cursor: 'pointer',
                          background: isExpanded ? '#f9fafb' : 'white',
                          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                            {campaign.name}
                          </h3>
                          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                            {campaign.objective} • {campaign.status}
                          </p>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                          gap: '16px',
                          textAlign: 'right'
                        }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Spend</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                              {formatCurrency(metric.spend || 0)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Impressions</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                              {formatNumber(metric.impressions || 0)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{isLeadGen ? 'Leads' : 'Conversions'}</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: getPerformanceColor(campaign.objective, metric) }}>
                              {isLeadGen ? metric.leads || 0 : metric.purchases || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Campaign Content */}
                      {isExpanded && (
                        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
                          {/* Campaign Metrics Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                          }}>
                            {[
                              { label: 'Spend', value: formatCurrency(metric.spend || 0), color: '#3b82f6' },
                              { label: 'Impressions', value: formatNumber(metric.impressions || 0), color: '#8b5cf6' },
                              { label: 'Clicks', value: formatNumber(metric.clicks || 0), color: '#06b6d4' },
                              { label: 'CTR', value: `${(metric.ctr || 0).toFixed(2)}%`, color: '#f59e0b' },
                              { label: 'CPC', value: formatCurrency(metric.cpc || 0), color: '#3b82f6' },
                              { label: isLeadGen ? 'Leads' : 'Conversions', value: formatNumber(isLeadGen ? metric.leads || 0 : metric.purchases || 0), color: '#10b981' },
                              { label: isLeadGen ? 'CPL' : 'ROAS', value: isLeadGen ? formatCurrency(metric.cpl || 0) : `${(metric.roas || 0).toFixed(2)}x`, color: '#ef4444' }
                            ].map((item, idx) => (
                              <div key={idx} style={{
                                background: '#f9fafb',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Ad Sets */}
                          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>
                              📍 Ad Sets ({campaignAdSets.length})
                            </h4>

                            {adSetsLoading[campaign.id] ? (
                              <SkeletonLoader height="100px" />
                            ) : campaignAdSets.length > 0 ? (
                              <div style={{ display: 'grid', gap: '16px' }}>
                                {campaignAdSets.map(adSet => {
                                  const adSetMetric = adSetMetrics[adSet.id] || {};
                                  const isAdSetExpanded = expandedCreatives === adSet.id;

                                  return (
                                    <div key={adSet.id} style={{
                                      background: '#f9fafb',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      overflow: 'hidden'
                                    }}>
                                      <div
                                        onClick={() => handleAdSetClick(adSet.id)}
                                        style={{
                                          padding: '16px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          background: isAdSetExpanded ? '#fff' : '#f9fafb'
                                        }}
                                      >
                                        <div>
                                          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>
                                            {adSet.name}
                                          </p>
                                          <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>
                                            Budget: {adSet.daily_budget ? `$${adSet.daily_budget}/day` : adSet.lifetime_budget ? `$${adSet.lifetime_budget} lifetime` : 'N/A'}
                                          </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>
                                            {formatCurrency(adSetMetric.spend || 0)}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {formatNumber(adSetMetric.impressions || 0)} imp
                                          </div>
                                        </div>
                                      </div>

                                      {/* Creatives Section - Using New Component */}
                                      {isAdSetExpanded && (
                                        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                                          <CreativeSection
                                            adSet={adSet}
                                            campaign={campaign}
                                            isLeadGen={isLeadGen}
                                            creativeMetrics={creativeMetrics}
                                            formatCurrency={formatCurrency}
                                            formatNumber={formatNumber}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No ad sets found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                Select an account to view campaigns
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
