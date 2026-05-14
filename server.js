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

// Config - Using direct app token
const META_APP_TOKEN = process.env.META_APP_TOKEN || '316381366067347|8nqUAToRP00z1_UbcCTnDIe08xg';

console.log('=== META PERFORMANCE ENGINE ===');
console.log('App Token:', META_APP_TOKEN ? '***SET***' : '***NOT SET***');
console.log('Mode: Direct Token (No OAuth needed)');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    message: 'Backend is running with direct Meta token'
  });
});

// Fetch campaigns from Meta using app token
app.post('/api/campaigns', async (req, res) => {
  try {
    const { adAccountId } = req.body;

    if (!adAccountId) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId is required'
      });
    }

    console.log(`Fetching campaigns for account: ${adAccountId}`);

    // Fetch campaigns directly from Meta Graph API using app token
    const campaignsResponse = await axios.get(
      `https://graph.instagram.com/v18.0/act_${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,objective,status,created_time,updated_time,spend',
          access_token: META_APP_TOKEN
        }
      }
    );

    const campaigns = campaignsResponse.data.data || [];
    console.log(`✅ Fetched ${campaigns.length} campaigns from Meta`);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ Campaign fetch error:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      data: []
    });
  }
});

// Fetch ad sets for a campaign
app.post('/api/ad-sets', async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'campaignId is required'
      });
    }

    console.log(`Fetching ad sets for campaign: ${campaignId}`);

    const adSetsResponse = await axios.get(
      `https://graph.instagram.com/v18.0/${campaignId}/adsets`,
      {
        params: {
          fields: 'id,name,status,created_time,spend',
          access_token: META_APP_TOKEN
        }
      }
    );

    const adSets = adSetsResponse.data.data || [];
    console.log(`✅ Fetched ${adSets.length} ad sets`);

    res.json({
      success: true,
      data: adSets,
      count: adSets.length
    });
  } catch (error) {
    console.error('❌ Ad sets fetch error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Fetch ads/creatives for an ad set
app.post('/api/ads', async (req, res) => {
  try {
    const { adSetId } = req.body;

    if (!adSetId) {
      return res.status(400).json({
        success: false,
        error: 'adSetId is required'
      });
    }

    console.log(`Fetching ads for ad set: ${adSetId}`);

    const adsResponse = await axios.get(
      `https://graph.instagram.com/v18.0/${adSetId}/ads`,
      {
        params: {
          fields: 'id,name,status,created_time,adset_id,creative',
          access_token: META_APP_TOKEN
        }
      }
    );

    const ads = adsResponse.data.data || [];
    console.log(`✅ Fetched ${ads.length} ads`);

    res.json({
      success: true,
      data: ads,
      count: ads.length
    });
  } catch (error) {
    console.error('❌ Ads fetch error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Fetch campaign insights/metrics
app.post('/api/insights', async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'campaignId is required'
      });
    }

    console.log(`Fetching insights for campaign: ${campaignId}`);

    const insightsResponse = await axios.get(
      `https://graph.instagram.com/v18.0/${campaignId}/insights`,
      {
        params: {
          fields: 'campaign_id,campaign_name,spend,impressions,clicks,reach',
          access_token: META_APP_TOKEN
        }
      }
    );

    const insights = insightsResponse.data.data || [];
    console.log(`✅ Fetched insights`);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('❌ Insights fetch error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const testResponse = await axios.get(
      'https://graph.instagram.com/v18.0/me',
      {
        params: {
          fields: 'id,name,email',
          access_token: META_APP_TOKEN
        }
      }
    );

    res.json({
      success: true,
      message: 'Meta connection successful',
      user: testResponse.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  console.log(`📍 POST /api/campaigns - Fetch campaigns`);
  console.log(`📍 POST /api/ad-sets - Fetch ad sets`);
  console.log(`📍 POST /api/ads - Fetch ads/creatives`);
  console.log(`📍 POST /api/insights - Fetch campaign metrics`);
  console.log(`📍 GET /api/test - Test Meta connection\n`);
});
