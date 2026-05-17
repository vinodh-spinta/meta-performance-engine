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

// Creative Card Component - Shows ad copy and creative info
const CreativeCard = ({ creative, isLeadGen, performanceColor }) => {
  const adCopy = creative.adCopy || 'No copy available';
  const headline = creative.headline || '';
  const creativeType = creative.creativeType || 'UNKNOWN';
  
  const typeIcons = {
    'STATIC': '🖼️',
    'VIDEO': '🎥',
    'CAROUSEL': '📸',
    'UNKNOWN': '📌',
    'NONE': '❌',
    'ERROR': '⚠️'
  };

  const icon = typeIcons[creativeType] || '📌';
  const truncatedCopy = adCopy.substring(0, 120) + (adCopy.length > 120 ? '...' : '');

  return (
    <div style={{
      background: '#f9fafb',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      display: 'grid',
      gridTemplateColumns: '60px 1fr',
      gap: '12px',
      alignItems: 'flex-start'
    }}>
      {/* Creative Type Badge */}
      <div style={{
        width: '60px',
        height: '60px',
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        position: 'relative',
        flexShrink: 0
      }}>
        {icon}
        <span style={{
          position: 'absolute',
          bottom: '-8px',
          right: '-8px',
          background: '#fff',
          border: '2px solid #667eea',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '700',
          color: '#667eea',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {creativeType === 'VIDEO' ? '🎥' : '📌'}
        </span>
      </div>

      {/* Creative Details */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '8px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '700', color: '#1f2937' }}>
            {creative.name || 'Ad ' + creative.id}
          </p>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            color: '#6b7280',
            marginRight: '6px'
          }}>
            {creativeType}
          </span>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: creative.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
            border: creative.status === 'ACTIVE' ? '1px solid #6ee7b7' : '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            color: creative.status === 'ACTIVE' ? '#047857' : '#6b7280'
          }}>
            {creative.status}
          </span>
        </div>

        {/* Ad Copy Display */}
        <p style={{
          margin: '8px 0',
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#374151',
          background: '#fff',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #f3f4f6',
          fontStyle: 'italic'
        }}>
          "{truncatedCopy}"
        </p>

        {headline && (
          <p style={{
            margin: '6px 0',
            fontSize: '11px',
            color: '#6b7280',
            background: '#f0f4ff',
            padding: '6px',
            borderRadius: '4px',
            borderLeft: '3px solid #667eea'
          }}>
            <strong>Headline:</strong> {headline}
          </p>
        )}
      </div>
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
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('performance');
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
      'CAD': 'C$', 'JPY': '¥', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$'
    };
    return symbols[currency] || currency;
  };

  const isLeadGenCampaign = (objective) => {
    const leadObjectives = ['LEAD_GENERATION', 'MESSAGES', 'OUTCOME_LEADS'];
    return leadObjectives.includes(objective);
  };

  const isEcommerceCampaign = (objective) => {
    const ecommerceObjectives = ['SALES', 'PRODUCT_CATALOG_SALES', 'CONVERSIONS', 'OUTCOME_SALES'];
    return ecommerceObjectives.includes(objective);
  };

  const getPerformanceColor = (objective, metrics) => {
    if (isLeadGenCampaign(objective)) {
      const cpl = parseFloat(metrics?.cpl) || 0;
      if (cpl === 0) return '#6b7280';
      if (cpl <= 5) return '#8b5cf6';
      if (cpl <= 10) return '#10b981';
      if (cpl <= 25) return '#3b82f6';
      if (cpl <= 50) return '#f59e0b';
      return '#ef4444';
    } else {
      const roas = parseFloat(metrics?.roas) || 0;
      if (roas >= 3) return '#8b5cf6';
      if (roas >= 2) return '#10b981';
      if (roas >= 1.5) return '#3b82f6';
      if (roas >= 1) return '#f59e0b';
      if (roas > 0) return '#ef4444';
      return '#6b7280';
    }
  };

  const getPerformanceLabel = (objective, metrics) => {
    if (isLeadGenCampaign(objective)) {
      const cpl = parseFloat(metrics?.cpl) || 0;
      if (cpl === 0) return '📊 No Data';
      if (cpl <= 5) return '🌟 Excellent';
      if (cpl <= 10) return '✨ Good';
      if (cpl <= 25) return '👍 Fair';
      if (cpl <= 50) return '⚠️ High';
      return '❌ Very High';
    } else {
      const roas = parseFloat(metrics?.roas) || 0;
      if (roas >= 3) return '🌟 Exceptional';
      if (roas >= 2) return '✨ Excellent';
      if (roas >= 1.5) return '👍 Good';
      if (roas >= 1) return '⚠️ Fair';
      if (roas > 0) return '❌ Poor';
      return '📊 No Data';
    }
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
      case 'performance':
        sorted.sort((a, b) => {
          const metricsA = campaignMetrics[a.id] || {};
          const metricsB = campaignMetrics[b.id] || {};
          
          if (isLeadGenCampaign(a.objective) && isLeadGenCampaign(b.objective)) {
            return (parseFloat(metricsA.cpl) || Infinity) - (parseFloat(metricsB.cpl) || Infinity);
          } else if (isEcommerceCampaign(a.objective) && isEcommerceCampaign(b.objective)) {
            return (parseFloat(metricsB.roas) || 0) - (parseFloat(metricsA.roas) || 0);
          }
          return 0;
        });
        break;
      case 'spend':
        sorted.sort((a, b) => (parseFloat(campaignMetrics[b.id]?.spend) || 0) - (parseFloat(campaignMetrics[a.id]?.spend) || 0));
        break;
      case 'impressions':
        sorted.sort((a, b) => (parseInt(campaignMetrics[b.id]?.impressions) || 0) - (parseInt(campaignMetrics[a.id]?.impressions) || 0));
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
        setSuccess(`✅ Loaded ${data.count} campaigns. Fetching metrics...`);
        fetchAllCampaignMetrics(data.data || [], token, dateRange);
      } else {
        setError(`Failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCampaignMetrics = async (campaignsArray, token, range) => {
    setMetricsLoading(true);
    const getRange = getDateRange(range);
    let start, end;
    
    if (getRange.days) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - getRange.days * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    } else {
      start = getRange.start;
      end = getRange.end;
    }

    const metricsMap = {};

    const fetchWithTimeout = (campaign, timeoutMs = 15000) => {
      return Promise.race([
        fetch(`${API_URL}/api/campaign-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, accessToken: token, dateStart: start, dateEnd: end })
        }).then(r => r.json()),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    const promises = campaignsArray.map(async (campaign, index) => {
      try {
        const data = await fetchWithTimeout(campaign);
        
        if (data.success) {
          metricsMap[campaign.id] = data.data;
        } else {
          metricsMap[campaign.id] = {
            spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
            purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
          };
        }
        setSuccess(`✅ Loading metrics... ${index + 1}/${campaignsArray.length}`);
      } catch (err) {
        console.error(`Error fetching metrics for campaign ${campaign.id}:`, err);
        metricsMap[campaign.id] = {
          spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
          purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
        };
      }
    });

    await Promise.all(promises);
    setCampaignMetrics(metricsMap);
    setMetricsLoading(false);
    setSuccess(`✅ All metrics loaded!`);
  };

  // Stage 3B - Fetch Ad Sets
  const fetchAdSets = async (campaignId, token) => {
    setAdSetsLoading(prev => ({ ...prev, [campaignId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/ad-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, accessToken: token })
      });
      const data = await response.json();
      if (data.success) {
        setAdSets(prev => ({ ...prev, [campaignId]: data.data || [] }));
        fetchAllAdSetMetrics(campaignId, data.data || [], token);
      }
    } catch (err) {
      console.error(`Error fetching ad sets for campaign ${campaignId}:`, err);
    } finally {
      setAdSetsLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const fetchAllAdSetMetrics = async (campaignId, adSetsArray, token) => {
    const getRange = getDateRange(dateRange);
    let start, end;
    
    if (getRange.days) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - getRange.days * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    } else {
      start = getRange.start;
      end = getRange.end;
    }

    const metricsMap = {};

    const fetchWithTimeout = (adSet, timeoutMs = 10000) => {
      return Promise.race([
        fetch(`${API_URL}/api/adset-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adSetId: adSet.id, accessToken: token, dateStart: start, dateEnd: end })
        }).then(r => r.json()),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    const promises = adSetsArray.map(async (adSet) => {
      try {
        const data = await fetchWithTimeout(adSet);
        if (data.success) {
          metricsMap[adSet.id] = data.data;
        } else {
          metricsMap[adSet.id] = {
            spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
            purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
          };
        }
      } catch (err) {
        metricsMap[adSet.id] = {
          spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
          purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
        };
      }
    });

    await Promise.all(promises);
    setAdSetMetrics(prev => ({ ...prev, ...metricsMap }));
  };

  // Stage 3C - Creatives are now fetched with ad sets, so we only need metrics
  // fetchCreatives function removed - creatives come from adSet.creatives

  const fetchAllCreativeMetrics = async (adSetId, creativesArray, token) => {
    const getRange = getDateRange(dateRange);
    let start, end;
    
    if (getRange.days) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - getRange.days * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    } else {
      start = getRange.start;
      end = getRange.end;
    }

    const metricsMap = {};

    const fetchWithTimeout = (creative, timeoutMs = 10000) => {
      return Promise.race([
        fetch(`${API_URL}/api/creative-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adId: creative.id, accessToken: token, dateStart: start, dateEnd: end })
        }).then(r => r.json()),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    const promises = creativesArray.map(async (creative) => {
      try {
        const data = await fetchWithTimeout(creative);
        if (data.success) {
          metricsMap[creative.id] = data.data;
        } else {
          metricsMap[creative.id] = {
            spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
            purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0, frequency: 0
          };
        }
      } catch (err) {
        metricsMap[creative.id] = {
          spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
          purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0, frequency: 0
        };
      }
    });

    await Promise.all(promises);
    setCreativeMetrics(prev => ({ ...prev, ...metricsMap }));
  };

  const handleCampaignClick = (campaign) => {
    if (expandedCampaign === campaign.id) {
      setExpandedCampaign(null);
      setExpandedCreatives(null);
    } else {
      setExpandedCampaign(campaign.id);
      if (!adSets[campaign.id]) {
        fetchAdSets(campaign.id, accessToken);
      }
    }
  };

  const handleAdSetClick = (adSetId) => {
    console.log(`📢 handleAdSetClick triggered for adSetId: ${adSetId}`);
    
    if (expandedCreatives === adSetId) {
      console.log(`   Collapsing creatives`);
      setExpandedCreatives(null);
    } else {
      console.log(`   Expanding creatives`);
      setExpandedCreatives(adSetId);
      // Creatives are already loaded with ad sets, no extra fetch needed!
    }
  };

  const handleDatePresetChange = (preset) => {
    setDateRange(preset);
    if (campaigns.length > 0) {
      fetchAllCampaignMetrics(campaigns, accessToken, preset);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
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
        setSuccess(`✅ Found ${data.count} ad accounts. Select one to view campaigns.`);
      } else {
        setError(`Failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorMsg = params.get('error');
    if (token) {
      setAccessToken(token);
      setLoggedIn(true);
      setSuccess('✅ Logged in successfully! Select an ad account to view campaigns.');
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
    setExpandedCreatives(null);
    setShowActiveOnly(true);
    setSortBy('performance');
    if (accessToken) {
      fetchCampaigns(accountId, accessToken);
    }
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login-url`);
      const data = await response.json();
      if (data.success) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setLoggingIn(false);
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
    setExpandedCreatives(null);
    setAdSets({});
    setAdSetMetrics({});
    setAdCreatives({});
    setCreativeMetrics({});
    setError('');
    setSuccess('');
    setShowActiveOnly(true);
    setSortBy('performance');
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    if (isNaN(num)) return `${getCurrencySymbol(selectedAccountCurrency)}0.00`;
    return `${getCurrencySymbol(selectedAccountCurrency)}${num.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    const num = parseInt(value) || 0;
    return num.toLocaleString();
  };

  const calculateSummary = () => {
    let totalSpend = 0, totalImpressions = 0;
    let totalPurchases = 0, totalPurchaseValue = 0;
    let totalLeads = 0;
    
    filteredCampaigns.forEach(campaign => {
      if (campaignMetrics[campaign.id]) {
        const m = campaignMetrics[campaign.id];
        totalSpend += parseFloat(m.spend) || 0;
        totalImpressions += parseInt(m.impressions) || 0;
        
        if (isLeadGenCampaign(campaign.objective)) {
          totalLeads += parseInt(m.leads) || 0;
        } else {
          totalPurchases += parseInt(m.purchases) || 0;
          totalPurchaseValue += parseFloat(m.purchaseValue) || 0;
        }
      }
    });

    const avgROAS = totalSpend > 0 && totalPurchaseValue > 0 ? (totalPurchaseValue / totalSpend).toFixed(2) : 0;
    const avgCPL = totalLeads > 0 && totalSpend > 0 ? (totalSpend / totalLeads).toFixed(2) : 0;
    
    return { totalSpend, totalImpressions, totalPurchases, totalLeads, totalPurchaseValue, avgROAS, avgCPL };
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
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
          textAlign: 'center',
          animation: 'slideInUp 0.5s ease-out'
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
            disabled={loggingIn}
            style={{
              width: '100%',
              padding: '14px',
              background: loggingIn ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: loggingIn ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s'
            }}
          >
            {loggingIn ? (
              <>
                <LoadingSpinner size="20px" color="white" />
                Connecting to Meta...
              </>
            ) : (
              <>🔐 Login with Meta</>
            )}
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
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
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
              Stage 3A, 3B & 3C - Campaigns, Ad Sets & Creatives ✅
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={selectedAccount}
              onChange={handleAccountChange}
              style={{
                flex: 1,
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
            <div style={{
              background: '#667eea',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              minWidth: '80px',
              textAlign: 'center'
            }}>
              {getCurrencySymbol(selectedAccountCurrency)}
            </div>
          </div>
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
              { label: summary.totalPurchases > 0 ? 'Total Purchases' : 'Total Leads', value: summary.totalPurchases > 0 ? formatNumber(summary.totalPurchases) : formatNumber(summary.totalLeads), color: '#10b981', icon: summary.totalPurchases > 0 ? '🛒' : '📞' },
              { label: summary.totalPurchases > 0 ? 'Avg ROAS' : 'Avg CPL', value: summary.totalPurchases > 0 ? `${summary.avgROAS}x` : formatCurrency(summary.avgCPL), color: '#f59e0b', icon: summary.totalPurchases > 0 ? '⭐' : '💵' }
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
                {metricsLoading ? (
                  <SkeletonLoader width="80%" height="32px" />
                ) : (
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: card.color }}>{card.value}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading Metrics */}
        {metricsLoading && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#92400e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⏳ Optimizing metrics... (parallel fetching in progress)
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
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              style={{
                padding: '8px 16px',
                background: showActiveOnly ? '#667eea' : '#f3f4f6',
                color: showActiveOnly ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {showActiveOnly ? '✅ Active Only' : '📋 Show All'}
            </button>

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
              <option value="performance">Sort: Performance</option>
              <option value="spend">Sort: Spend</option>
              <option value="impressions">Sort: Impressions</option>
              <option value="name">Sort: Name</option>
            </select>

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
            </div>
          </div>
        )}

        {/* Campaigns List with Ad Sets and Creatives */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px', color: '#1f2937' }}>
            🎯 Campaigns ({filteredCampaigns.length} of {campaigns.length})
          </h2>
          {filteredCampaigns.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredCampaigns.map((campaign) => {
                const metrics = campaignMetrics[campaign.id] || {
                  spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
                  purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
                };
                const isLeadGen = isLeadGenCampaign(campaign.objective);
                const performanceColor = getPerformanceColor(campaign.objective, metrics);
                const performanceLabel = getPerformanceLabel(campaign.objective, metrics);
                const campaignAdSets = adSets[campaign.id] || [];

                return (
                  <div key={campaign.id}>
                    {/* Campaign Card */}
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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Spend</p>
                            {metricsLoading ? <SkeletonLoader width="80%" height="24px" /> : <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(metrics.spend)}</p>}
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Impressions</p>
                            {metricsLoading ? <SkeletonLoader width="80%" height="24px" /> : <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>{formatNumber(metrics.impressions)}</p>}
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{isLeadGen ? 'Leads' : 'Purchases'}</p>
                            {metricsLoading ? <SkeletonLoader width="80%" height="24px" /> : <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{isLeadGen ? formatNumber(metrics.leads) : formatNumber(metrics.purchases)}</p>}
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{isLeadGen ? 'CPL' : 'ROAS'}</p>
                            {metricsLoading ? <SkeletonLoader width="80%" height="24px" /> : <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: performanceColor }}>{isLeadGen ? formatCurrency(metrics.cpl) : `${(parseFloat(metrics.roas) || 0).toFixed(2)}x`}</p>}
                          </div>
                        </div>

                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                          {campaign.objective} • {performanceLabel} • 📢 {campaignAdSets.length} Ad Sets
                        </p>
                      </div>

                      <span style={{
                        fontSize: '20px',
                        color: '#667eea',
                        transform: expandedCampaign === campaign.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        marginLeft: '16px'
                      }}>
                        ▼
                      </span>
                    </div>

                    {/* Expanded Campaign - Detailed Metrics + Ad Sets */}
                    {expandedCampaign === campaign.id && (
                      <div style={{
                        background: '#f9fafb',
                        padding: '20px',
                        borderRadius: '0 0 12px 12px',
                        borderLeft: '2px solid #667eea',
                        borderRight: '2px solid #667eea',
                        borderBottom: '2px solid #667eea',
                        marginTop: '-1px'
                      }}>
                        {/* Detailed Metrics Grid */}
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>📊 Detailed Metrics</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            {isLeadGen && [
                              { label: 'Spend', value: formatCurrency(metrics.spend), color: '#3b82f6' },
                              { label: 'Impressions', value: formatNumber(metrics.impressions), color: '#8b5cf6' },
                              { label: 'Clicks', value: formatNumber(metrics.clicks), color: '#06b6d4' },
                              { label: 'CTR', value: (parseFloat(metrics.ctr) || 0).toFixed(2) + '%', color: '#f59e0b' },
                              { label: 'CPC', value: formatCurrency(metrics.cpc), color: '#ec4899' },
                              { label: 'Leads', value: formatNumber(metrics.leads), color: '#10b981' },
                              { label: 'CPL', value: formatCurrency(metrics.cpl), color: performanceColor, highlight: true }
                            ]?.map((item, i) => (
                              <div key={i} style={{
                                background: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                border: item.highlight ? `2px solid ${performanceColor}` : '1px solid #e5e7eb'
                              }}>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: item.color }}>{item.value}</p>
                              </div>
                            ))}
                            {!isLeadGen && [
                              { label: 'Spend', value: formatCurrency(metrics.spend), color: '#3b82f6' },
                              { label: 'Impressions', value: formatNumber(metrics.impressions), color: '#8b5cf6' },
                              { label: 'Clicks', value: formatNumber(metrics.clicks), color: '#06b6d4' },
                              { label: 'CTR', value: (parseFloat(metrics.ctr) || 0).toFixed(2) + '%', color: '#f59e0b' },
                              { label: 'CPC', value: formatCurrency(metrics.cpc), color: '#ec4899' },
                              { label: 'Purchases', value: formatNumber(metrics.purchases), color: '#10b981' },
                              { label: 'Purchase Value', value: formatCurrency(metrics.purchaseValue), color: '#10b981' },
                              { label: 'ROAS', value: (parseFloat(metrics.roas) || 0).toFixed(2) + 'x', color: performanceColor, highlight: true }
                            ]?.map((item, i) => (
                              <div key={i} style={{
                                background: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                border: item.highlight ? `2px solid ${performanceColor}` : '1px solid #e5e7eb'
                              }}>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: item.color }}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ad Sets Section - Stage 3B */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>
                            📢 Ad Sets ({campaignAdSets.length})
                          </h4>
                          {adSetsLoading[campaign.id] ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Loading ad sets...</p>
                          ) : campaignAdSets.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                              {campaignAdSets.map((adSet) => {
                                const adSetMetric = adSetMetrics[adSet.id] || {
                                  spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
                                  purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0
                                };
                                const adSetPerformanceColor = getPerformanceColor(campaign.objective, adSetMetric);

                                return (
                                  <div key={adSet.id}>
                                    <div
                                      onClick={() => handleAdSetClick(adSet.id)}
                                      style={{
                                        background: 'white',
                                        border: expandedCreatives === adSet.id ? '2px solid #10b981' : '1px solid #e5e7eb',
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
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                                          {adSet.name}
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                                          <div>
                                            <span style={{ color: '#6b7280' }}>Spend:</span> <span style={{ fontWeight: '600', color: '#3b82f6' }}>{formatCurrency(adSetMetric.spend)}</span>
                                          </div>
                                          <div>
                                            <span style={{ color: '#6b7280' }}>Impressions:</span> <span style={{ fontWeight: '600', color: '#8b5cf6' }}>{formatNumber(adSetMetric.impressions)}</span>
                                          </div>
                                          <div>
                                            <span style={{ color: '#6b7280' }}>{isLeadGen ? 'Leads' : 'Purchases'}:</span> <span style={{ fontWeight: '600', color: '#10b981' }}>{isLeadGen ? formatNumber(adSetMetric.leads) : formatNumber(adSetMetric.purchases)}</span>
                                          </div>
                                          <div>
                                            <span style={{ color: '#6b7280' }}>{isLeadGen ? 'CPL' : 'ROAS'}:</span> <span style={{ fontWeight: '600', color: adSetPerformanceColor }}>{isLeadGen ? formatCurrency(adSetMetric.cpl) : `${(parseFloat(adSetMetric.roas) || 0).toFixed(2)}x`}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <span style={{
                                        fontSize: '16px',
                                        color: '#10b981',
                                        transform: expandedCreatives === adSet.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s',
                                        marginLeft: '12px'
                                      }}>
                                        ▼
                                      </span>
                                    </div>

                                    {/* Expanded Ad Set - Creatives Section - Stage 3C */}
                                    {expandedCreatives === adSet.id && (
                                      <div style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '0 0 8px 8px',
                                        borderLeft: '2px solid #10b981',
                                        borderRight: '2px solid #10b981',
                                        borderBottom: '2px solid #10b981',
                                        marginTop: '-1px',
                                        marginBottom: '12px'
                                      }}>
                                        {/* Ad Set Full Metrics */}
                                        <div style={{ marginBottom: '16px' }}>
                                          <h5 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#1f2937' }}>Ad Set Performance</h5>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                            {isLeadGen && [
                                              { label: 'Spend', value: formatCurrency(adSetMetric.spend), color: '#3b82f6' },
                                              { label: 'Impressions', value: formatNumber(adSetMetric.impressions), color: '#8b5cf6' },
                                              { label: 'Clicks', value: formatNumber(adSetMetric.clicks), color: '#06b6d4' },
                                              { label: 'CTR', value: (parseFloat(adSetMetric.ctr) || 0).toFixed(2) + '%', color: '#f59e0b' },
                                              { label: 'CPC', value: formatCurrency(adSetMetric.cpc), color: '#ec4899' },
                                              { label: 'Leads', value: formatNumber(adSetMetric.leads), color: '#10b981' },
                                              { label: 'CPL', value: formatCurrency(adSetMetric.cpl), color: adSetPerformanceColor, highlight: true }
                                            ]?.map((item, i) => (
                                              <div key={i} style={{
                                                background: '#f9fafb',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: item.highlight ? `2px solid ${adSetPerformanceColor}` : '1px solid #e5e7eb',
                                                fontSize: '11px'
                                              }}>
                                                <p style={{ margin: 0, color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{item.label}</p>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: item.color }}>{item.value}</p>
                                              </div>
                                            ))}
                                            {!isLeadGen && [
                                              { label: 'Spend', value: formatCurrency(adSetMetric.spend), color: '#3b82f6' },
                                              { label: 'Impressions', value: formatNumber(adSetMetric.impressions), color: '#8b5cf6' },
                                              { label: 'Clicks', value: formatNumber(adSetMetric.clicks), color: '#06b6d4' },
                                              { label: 'CTR', value: (parseFloat(adSetMetric.ctr) || 0).toFixed(2) + '%', color: '#f59e0b' },
                                              { label: 'CPC', value: formatCurrency(adSetMetric.cpc), color: '#ec4899' },
                                              { label: 'Purchases', value: formatNumber(adSetMetric.purchases), color: '#10b981' },
                                              { label: 'Purchase Value', value: formatCurrency(adSetMetric.purchaseValue), color: '#10b981' },
                                              { label: 'ROAS', value: (parseFloat(adSetMetric.roas) || 0).toFixed(2) + 'x', color: adSetPerformanceColor, highlight: true }
                                            ]?.map((item, i) => (
                                              <div key={i} style={{
                                                background: '#f9fafb',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                border: item.highlight ? `2px solid ${adSetPerformanceColor}` : '1px solid #e5e7eb',
                                                fontSize: '11px'
                                              }}>
                                                <p style={{ margin: 0, color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{item.label}</p>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: item.color }}>{item.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Creatives Section */}
                                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                                          <h5 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#1f2937' }}>
                                            🎬 Creatives ({(adSet.creatives || []).length})
                                          </h5>
                                          {(adSet.creatives || []).length > 0 ? (
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                              {(adSet.creatives || []).map((creative) => {
                                                const creativeMetric = creativeMetrics[creative.id] || {
                                                  spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
                                                  purchases: 0, purchaseValue: 0, roas: 0, leads: 0, cpl: 0, frequency: 0
                                                };
                                                const creativePerformanceColor = getPerformanceColor(campaign.objective, creativeMetric);

                                                return (
                                                  <div key={creative.id} style={{
                                                    background: '#f9fafb',
                                                    padding: '12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e5e7eb',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'flex-start'
                                                  }}>
                                                    {/* Creative Preview */}
                                                    <CreativeCard creative={creative} isLeadGen={isLeadGen} performanceColor={creativePerformanceColor} />

                                                    {/* Creative Metrics */}
                                                    <div style={{ flex: 1 }}>
                                                      <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#1f2937' }}>
                                                        {creative.name || 'Creative'}
                                                      </p>
                                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', fontSize: '11px' }}>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>Spend:</span> <span style={{ fontWeight: '600', color: '#3b82f6' }}>{formatCurrency(creativeMetric.spend)}</span>
                                                        </div>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>Impressions:</span> <span style={{ fontWeight: '600', color: '#8b5cf6' }}>{formatNumber(creativeMetric.impressions)}</span>
                                                        </div>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>Clicks:</span> <span style={{ fontWeight: '600', color: '#06b6d4' }}>{formatNumber(creativeMetric.clicks)}</span>
                                                        </div>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>Freq:</span> <span style={{ fontWeight: '600', color: '#f59e0b' }}>{(parseFloat(creativeMetric.frequency) || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>{isLeadGen ? 'Leads' : 'Conv'}:</span> <span style={{ fontWeight: '600', color: '#10b981' }}>{isLeadGen ? formatNumber(creativeMetric.leads) : formatNumber(creativeMetric.purchases)}</span>
                                                        </div>
                                                        <div>
                                                          <span style={{ color: '#6b7280' }}>{isLeadGen ? 'CPL' : 'ROAS'}:</span> <span style={{ fontWeight: '600', color: creativePerformanceColor }}>{isLeadGen ? formatCurrency(creativeMetric.cpl) : `${(parseFloat(creativeMetric.roas) || 0).toFixed(2)}x`}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '12px', fontSize: '12px' }}>No creatives found</p>
                                          )}
                                        </div>
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
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px', margin: 0 }}>
              {loading ? 'Loading campaigns...' : campaigns.length === 0 ? 'Select an ad account to view campaigns.' : 'No active campaigns found.'}
            </p>
          )}
        </div>

        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          margin: '40px 0 0'
        }}>
          🚀 Stage 3A ✅ | Stage 3B ✅ | Stage 3C ✅ | 🔐 Securely connected | Creative previews enabled
        </p>
      </div>
    </div>
  );
}
