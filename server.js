require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Config
const META_APP_ID = process.env.META_APP_ID || '1601962987562179';
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://meta-performance-engine-production.up.railway.app/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://meta-performance-engine-ads.vercel.app';

console.log('=== META PERFORMANCE ENGINE - OAUTH PRODUCTION ===');
console.log('✅ App ID:', META_APP_ID);
console.log('✅ Redirect URI:', REDIRECT_URI);
console.log('✅ Frontend URL:', FRONTEND_URL);
console.log('✅ Ready for OAuth flow\n');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    message: 'Backend is running with OAuth enabled'
  });
});

// Step 1: Generate OAuth login URL
app.get('/api/auth/login-url', (req, res) => {
  const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_management,ads_read,business_management&state=random_state_string`;

  res.json({
    success: true,
    url: loginUrl
  });
});

// Step 2: Handle OAuth callback and exchange code for token
app.get('/api/auth/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('❌ OAuth error:', error);
      return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${FRONTEND_URL}?error=No+authorization+code`);
    }

    console.log('🔐 OAuth callback received, exchanging code for token...');

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained from Meta');

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}?token=${accessToken}`);
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
  }
});

// Step 3: Fetch ad accounts for authenticated user
app.post('/api/ad-accounts', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    console.log('📊 Fetching ad accounts for user...');

    // Fetch ad accounts
    const accountsResponse = await axios.get(
      'https://graph.facebook.com/v18.0/me/adaccounts',
      {
        params: {
          fields: 'id,name,account_id,business_name',
          access_token: accessToken
        }
      }
    );

    const adAccounts = accountsResponse.data.data || [];
    console.log(`✅ Fetched ${adAccounts.length} ad accounts\n`);

    res.json({
      success: true,
      data: adAccounts,
      count: adAccounts.length
    });
  } catch (error) {
    console.error('❌ Error fetching ad accounts:', error.response?.data?.error?.message || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      data: []
    });
  }
});

// Step 4: Fetch campaigns for selected ad account
app.post('/api/campaigns', async (req, res) => {
  try {
    const { adAccountId, accessToken } = req.body;

    if (!adAccountId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId and accessToken are required'
      });
    }

    console.log(`📊 Fetching campaigns for account: ${adAccountId}`);

    // Fetch campaigns
    const campaignsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,objective,status,created_time,updated_time',
          access_token: accessToken
        }
      }
    );

    const campaigns = campaignsResponse.data.data || [];
    console.log(`✅ Fetched ${campaigns.length} campaigns\n`);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error.response?.data?.error?.message || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      data: []
    });
  }
});

// Step 5: Fetch ad sets for a campaign
app.post('/api/ad-sets', async (req, res) => {
  try {
    const { campaignId, accessToken } = req.body;

    if (!campaignId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'campaignId and accessToken are required'
      });
    }

    console.log(`📊 Fetching ad sets for campaign: ${campaignId}`);

    const adSetsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${campaignId}/adsets`,
      {
        params: {
          fields: 'id,name,status,created_time',
          access_token: accessToken
        }
      }
    );

    const adSets = adSetsResponse.data.data || [];
    console.log(`✅ Fetched ${adSets.length} ad sets\n`);

    res.json({
      success: true,
      data: adSets,
      count: adSets.length
    });
  } catch (error) {
    console.error('❌ Error fetching ad sets:', error.response?.data?.error?.message || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Step 6: Fetch campaign insights (metrics like spend, impressions, etc)
app.post('/api/campaign-insights', async (req, res) => {
  try {
    const { campaignId, accessToken, dateStart, dateEnd } = req.body;

    if (!campaignId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'campaignId and accessToken are required'
      });
    }

    console.log(`📊 Fetching insights for campaign: ${campaignId}`);

    // Default to last 30 days if no dates provided
    let start = dateStart;
    let end = dateEnd;
    
    if (!start || !end) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    }

    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${campaignId}/insights`,
      {
        params: {
          fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions',
          time_range: JSON.stringify({
            since: start,
            until: end
          }),
          access_token: accessToken
        }
      }
    );

    const insights = insightsResponse.data.data && insightsResponse.data.data.length > 0 
      ? insightsResponse.data.data[0]
      : {};

    console.log(`✅ Fetched insights for campaign ${campaignId}\n`);

    res.json({
      success: true,
      data: {
        campaignId: campaignId,
        spend: parseFloat(insights.spend || 0),
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        ctr: parseFloat(insights.ctr || 0),
        cpc: parseFloat(insights.cpc || 0),
        conversions: parseInt(insights.conversions || 0),
        actions: insights.actions || [],
        action_values: insights.action_values || [],
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching campaign insights:', error.response?.data?.error?.message || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      data: {}
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📍 GET /api/auth/login-url - Generate OAuth login URL`);
  console.log(`📍 GET /api/auth/callback - OAuth callback (Meta redirects here)`);
  console.log(`📍 POST /api/ad-accounts - Fetch user's ad accounts`);
  console.log(`📍 POST /api/campaigns - Fetch campaigns for account`);
  console.log(`📍 POST /api/ad-sets - Fetch ad sets for campaign`);
  console.log(`📍 POST /api/campaign-insights - Fetch campaign metrics (spend, impressions, etc)\n`);
});
