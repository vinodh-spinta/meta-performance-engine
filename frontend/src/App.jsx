import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sankey, Sink, Source, Link as SankeyLink } from 'recharts';

const API_URL = 'https://meta-performance-engine-production.up.railway.app';

// Mock data generator - simulates real Meta API response
const generateMockAccount = () => ({
  id: 1,
  account_name: 'Spatial Sleep - US',
  ad_account_id: '690235150132517',
  campaigns: [
    {
      id: 1,
      campaign_name: 'America Sleeps Better Q1',
      total_spend: 15420.50,
      total_revenue: 87500,
      avg_roas: 5.67,
      avg_cpa: 12.50,
      total_conversions: 1234,
      ad_set_count: 5,
      creative_count: 18
    },
    {
      id: 2,
      campaign_name: 'Sleep Bundle Promo',
      total_spend: 8900.75,
      total_revenue: 42100,
      avg_roas: 4.73,
      avg_cpa: 15.20,
      total_conversions: 585,
      ad_set_count: 3,
      creative_count: 12
    }
  ],
  creatives: [
    {
      id: 1,
      creative_name: 'Video: Sleep Science Breakdown',
      creative_type: 'video',
      total_spend: 3200,
      total_revenue: 21400,
      avg_roas: 6.69,
      avg_cpa: 10.50,
      total_conversions: 305,
      total_impressions: 45000,
      avg_ctr: 2.4,
      age_in_days: 18,
      status: 'ACTIVE'
    },
    {
      id: 2,
      creative_name: 'Carousel: Product Benefits',
      creative_type: 'carousel',
      total_spend: 2800,
      total_revenue: 18900,
      avg_roas: 6.75,
      avg_cpa: 9.85,
      total_conversions: 284,
      total_impressions: 52000,
      avg_ctr: 2.8,
      age_in_days: 12,
      status: 'ACTIVE'
    },
    {
      id: 3,
      creative_name: 'Static: Customer Testimonial',
      creative_type: 'image',
      total_spend: 2100,
      total_revenue: 12300,
      avg_roas: 5.86,
      avg_cpa: 13.20,
      total_conversions: 159,
      total_impressions: 38000,
      avg_ctr: 1.9,
      age_in_days: 31,
      status: 'PAUSED'
    },
    {
      id: 4,
      creative_name: 'Video: Sleep Challenge Results',
      creative_type: 'video',
      total_spend: 1850,
      total_revenue: 8200,
      avg_roas: 4.43,
      avg_cpa: 18.50,
      total_conversions: 100,
      total_impressions: 32000,
      avg_ctr: 1.2,
      age_in_days: 25,
      status: 'ACTIVE'
    }
  ],
  journeys: [
    { source: 'Video: Sleep Science', target: 'Carousel: Benefits', value: 450 },
    { source: 'Carousel: Benefits', target: 'Conversion', value: 420 },
    { source: 'Video: Sleep Science', target: 'Conversion', value: 305 },
    { source: 'Static: Testimonial', target: 'Video: Results', value: 230 },
    { source: 'Video: Results', target: 'Conversion', value: 189 },
    { source: 'Static: Testimonial', target: 'Conversion', value: 159 }
  ],
  recommendations: [
    {
      id: 1,
      creative_id: 3,
      recommendation_type: 'PAUSE',
      creative_name: 'Static: Customer Testimonial',
      action_description: 'Pause Static: Customer Testimonial due to age and declining performance',
      reasoning: 'Creative is 31 days old with declining ROAS (5.86x → 4.5x trend). CTR down 40% from week 1. Audience fatigue detected: frequency 12.5x (target: <10x). Cost per acquisition rising.',
      expected_impact: 'Save $2,100/month. Reallocate to high-performing Video: Sleep Science Breakdown. Estimated +$4,200 additional revenue',
      confidence_score: 0.92,
      current_spend: 2100,
      recommended_spend: 0
    },
    {
      id: 2,
      creative_id: 1,
      recommendation_type: 'SCALE_UP',
      creative_name: 'Video: Sleep Science Breakdown',
      action_description: 'Increase budget by 50% for Video: Sleep Science Breakdown',
      reasoning: 'Top performer: 6.69x ROAS, 2.4% CTR, only 18 days old with strong upward trend. Still climbing growth curve. Room to scale without saturation (frequency only 8.2x). Low CPA ($10.50) leaves headroom.',
      expected_impact: 'Potential +$9,500 revenue at current ROAS. Budget increase: +$1,600. ROI: +550%',
      confidence_score: 0.88,
      current_spend: 3200,
      recommended_spend: 4800
    },
    {
      id: 3,
      creative_id: 4,
      recommendation_type: 'REDUCE',
      creative_name: 'Video: Sleep Challenge Results',
      action_description: 'Reduce budget by 40% for Video: Sleep Challenge Results',
      reasoning: 'ROAS declining from initial 5.8x to 4.43x. Frequency climbing (11.2x, approaching 12x limit). Age 25 days shows classic fatigue curve pattern. CPA rising ($15 → $18.50). Still profitable but trajectory negative.',
      expected_impact: 'Protect profitability margin. Save $740/month without losing key conversions. Preserve audience for future refresh cycles.',
      confidence_score: 0.85,
      current_spend: 1850,
      recommended_spend: 1110
    },
    {
      id: 4,
      creative_id: 2,
      recommendation_type: 'MAINTAIN',
      creative_name: 'Carousel: Product Benefits',
      action_description: 'Maintain current spend - steady performer',
      reasoning: '6.75x ROAS, young creative (12 days old), consistent growth trajectory. Frequency 8.1x still healthy with room before fatigue. CPA stable at $9.85. Multi-touch attribution shows strong role in conversion paths.',
      expected_impact: 'Continue current trajectory. Monitor next 7-10 days for scaling opportunity when age reaches 18-20 days. Expected ROAS stability',
      confidence_score: 0.91,
      current_spend: 2800,
      recommended_spend: 2800
    }
  ]
});

export default function MetaDashboard() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [approvedRecs, setApprovedRecs] = useState(new Set());

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // For MVP, use mock data
      setTimeout(() => {
        setUser({ email: email, id: 1 });
        setAccounts([generateMockAccount()]);
        setSelectedAccount(generateMockAccount());
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccounts([]);
    setSelectedAccount(null);
    setApprovedRecs(new Set());
  };

  const handleApproveRec = (recId) => {
    setApprovedRecs(new Set([...approvedRecs, recId]));
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>Meta Performance</h1>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>Engine</h2>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>AI-powered ads analytics & optimization</p>
          
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            
            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>{error}</p>}
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', fontSize: '15px' }}>
              {loading ? 'Loading...' : 'Login'}
            </button>
            
            <button type="button" onClick={() => setIsSignup(!isSignup)} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#3b82f6', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              {isSignup ? 'Already have account?' : 'Try demo login'}
            </button>
          </form>
          
          <p style={{ margin: '20px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Demo: test@example.com / password123</p>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>Accounts</h1>
            <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
          </div>
          
          <p style={{ color: '#64748b', marginBottom: '24px', fontWeight: '500' }}>Select an account</p>
          {accounts.map(acc => (
            <div key={acc.id} onClick={() => setSelectedAccount(acc)} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer', border: '2px solid #e2e8f0', transition: 'all 0.2s' }}>
              <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>{acc.account_name}</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>Ad Account ID: {acc.ad_account_id}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const campaignMetrics = selectedAccount.campaigns || [];
  const creativeMetrics = selectedAccount.creatives || [];
  const recommendations = selectedAccount.recommendations || [];

  const totalSpend = campaignMetrics.reduce((sum, c) => sum + c.total_spend, 0);
  const totalRevenue = campaignMetrics.reduce((sum, c) => sum + c.total_revenue, 0);
  const avgRoas = (totalRevenue / totalSpend).toFixed(2);
  const totalConversions = campaignMetrics.reduce((sum, c) => sum + c.total_conversions, 0);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700' }}>Meta Performance Engine</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Account: {selectedAccount.account_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setSelectedAccount(null)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Spend</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>${(totalSpend / 1000).toFixed(1)}K</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#10b981' }}>${(totalRevenue / 1000).toFixed(1)}K</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Avg ROAS</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{avgRoas}x</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Conversions</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#ec4899' }}>{totalConversions.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 40px', display: 'flex', gap: '8px', borderBottom: '1px solid #334155', marginBottom: '32px', overflowX: 'auto' }}>
        {['campaigns', 'creatives', 'journeys', 'recommendations'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '14px 20px', background: activeTab === tab ? '#3b82f6' : 'transparent', color: activeTab === tab ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {tab === 'campaigns' && '📊 Campaigns'}
            {tab === 'creatives' && '🎬 Creatives'}
            {tab === 'journeys' && '🔄 Journeys'}
            {tab === 'recommendations' && '✨ Recommendations'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>Campaign Performance</h2>
            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Campaign</th>
                    <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Spend</th>
                    <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Revenue</th>
                    <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>ROAS</th>
                    <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>Conversions</th>
                    <th style={{ textAlign: 'right', padding: '16px', color: '#94a3b8', fontWeight: '600' }}>CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignMetrics.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i < campaignMetrics.length - 1 ? '1px solid #334155' : 'none' }}>
                      <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: '500' }}>{c.campaign_name}</td>
                      <td style={{ textAlign: 'right', padding: '16px', color: '#94a3b8' }}>${c.total_spend.toFixed(0)}</td>
                      <td style={{ textAlign: 'right', padding: '16px', color: '#10b981', fontWeight: '600' }}>${c.total_revenue.toFixed(0)}</td>
                      <td style={{ textAlign: 'right', padding: '16px', color: '#f59e0b', fontWeight: '700' }}>{c.avg_roas.toFixed(2)}x</td>
                      <td style={{ textAlign: 'right', padding: '16px', color: '#ec4899' }}>{c.total_conversions}</td>
                      <td style={{ textAlign: 'right', padding: '16px', color: '#3b82f6' }}>${c.avg_cpa.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Creatives Tab */}
        {activeTab === 'creatives' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>Creative-Level Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {creativeMetrics.map(c => (
                <div key={c.id} style={{ background: '#1e293b', borderRadius: '8px', padding: '20px', border: '1px solid #334155', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '16px', color: '#e2e8f0' }}>{c.creative_name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{c.creative_type.toUpperCase()} • {c.age_in_days} days old • {c.total_impressions.toLocaleString()} impressions</p>
                    </div>
                    <span style={{ background: c.age_in_days > 28 ? '#dc2626' : c.age_in_days > 20 ? '#f59e0b' : '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      {c.age_in_days > 28 ? '⚠️ FATIGUED' : c.age_in_days > 20 ? '⏱️ MONITOR' : '✨ FRESH'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '12px 0', borderTop: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>ROAS</p>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#f59e0b' }}>{c.avg_roas.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>CPA</p>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#3b82f6' }}>${c.avg_cpa.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>CTR</p>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{c.avg_ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Spend</p>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#ec4899' }}>${c.total_spend.toFixed(0)}</p>
                    </div>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}><strong>{c.total_conversions}</strong> conversions • <strong>${c.total_revenue.toFixed(0)}</strong> revenue</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journeys Tab */}
        {activeTab === 'journeys' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>User Journey Paths (Multi-Touch Attribution)</h2>
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: '1px solid #334155' }}>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#cbd5e1' }}>Each flow shows user paths through multiple creative touchpoints before conversion. Thicker lines indicate more conversions through that path.</p>
              <div style={{ background: '#0f172a', borderRadius: '6px', padding: '20px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0 }}>📊 Multi-touch Attribution Sankey Diagram</p>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>(Interactive visualization)</p>
                  
                  <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Video → Carousel → Conversion</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>420</p>
                    </div>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Video → Direct Conversion</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10b981' }}>305</p>
                    </div>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Static → Video → Conversion</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>189</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700' }}>✨ AI-Powered Recommendations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {recommendations.map(rec => (
                <div key={rec.id} style={{ background: '#1e293b', borderRadius: '8px', padding: '24px', border: `2px solid ${rec.recommendation_type === 'PAUSE' ? '#dc2626' : rec.recommendation_type === 'SCALE_UP' ? '#10b981' : rec.recommendation_type === 'REDUCE' ? '#f59e0b' : '#3b82f6'}`, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ background: rec.recommendation_type === 'PAUSE' ? '#dc2626' : rec.recommendation_type === 'SCALE_UP' ? '#10b981' : rec.recommendation_type === 'REDUCE' ? '#f59e0b' : '#3b82f6', color: 'white', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                          {rec.recommendation_type === 'PAUSE' && '⏸ PAUSE'}
                          {rec.recommendation_type === 'SCALE_UP' && '📈 SCALE UP'}
                          {rec.recommendation_type === 'REDUCE' && '📉 REDUCE'}
                          {rec.recommendation_type === 'MAINTAIN' && '✓ MAINTAIN'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Confidence: {(rec.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontWeight: '700', fontSize: '18px', color: '#e2e8f0' }}>{rec.creative_name}</p>
                      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#cbd5e1' }}>{rec.action_description}</p>
                      
                      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Why this recommendation?</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>{rec.reasoning}</p>
                      </div>
                      
                      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '6px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Expected Impact</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>{rec.expected_impact}</p>
                      </div>
                    </div>
                    
                    <div style={{ marginLeft: '24px', padding: '16px', background: '#0f172a', borderRadius: '8px', minWidth: '180px', textAlign: 'center', border: '1px solid #334155' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Current Spend</p>
                      <p style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>${rec.current_spend.toFixed(0)}</p>
                      
                      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Recommended</p>
                      <p style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#10b981' }}>${rec.recommended_spend.toFixed(0)}</p>
                      
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Change: {rec.recommended_spend > rec.current_spend ? '+' : ''}{(((rec.recommended_spend - rec.current_spend) / rec.current_spend) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
                    {!approvedRecs.has(rec.id) ? (
                      <>
                        <button onClick={() => handleApproveRec(rec.id)} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
                          ✓ Approve & Execute
                        </button>
                        <button style={{ flex: 1, padding: '12px', background: 'transparent', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <div style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', borderRadius: '6px', fontWeight: '700', textAlign: 'center', fontSize: '14px' }}>
                        ✓ Executed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '40px', marginTop: '40px', borderTop: '1px solid #334155', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>Meta Performance Engine v1.0 • Backend: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '3px', color: '#3b82f6' }}>{API_URL}</code></p>
        <p style={{ margin: '8px 0 0' }}>Currently using mock data. Connect real Meta API tokens to see live account data.</p>
      </div>
    </div>
  );
}
