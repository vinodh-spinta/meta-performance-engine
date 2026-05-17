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
const API_VERSION = process.env.META_API_VERSION || 'v18.0';

console.log('\n🚀 META PERFORMANCE ENGINE - PRODUCTION BACKEND');
console.log('='.repeat(50));
console.log(`✅ App ID: ${META_APP_ID}`);
console.log(`✅ API Version: ${API_VERSION}`);
console.log(`✅ Redirect URI: ${REDIRECT_URI}`);
console.log(`✅ Frontend URL: ${FRONTEND_URL}`);
console.log('='.repeat(50) + '\n');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    message: 'Backend is running with enhanced logging',
    version: API_VERSION
  });
});

// Step 1: Generate OAuth login URL
app.get('/api/auth/login-url', (req, res) => {
  const loginUrl = `https://www.facebook.com/${API_VERSION}/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_management,ads_read,business_management&state=random_state_string`;
  
  res.json({
    success: true,
    url: loginUrl
  });
});

// Step 2: Handle OAuth callback
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

    console.log('🔐 OAuth callback - exchanging code for token...');

    const tokenResponse = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/oauth/access_token`,
      {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained\n');

    res.redirect(`${FRONTEND_URL}?token=${accessToken}`);
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
  }
});

// Step 3: Fetch ad accounts
app.post('/api/ad-accounts', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    console.log('📊 Fetching ad accounts...');

    const accountsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/me/adaccounts`,
      {
        params: {
          fields: 'id,name,currency,account_status',
          access_token: accessToken
        }
      }
    );

    const accounts = (accountsResponse.data.data || []).map(account => ({
      id: account.id,
      name: account.name,
      currency: account.currency || 'USD',
      status: account.account_status
    }));

    console.log(`✅ Fetched ${accounts.length} ad accounts`);
    console.log(`📍 Currencies: ${accounts.map(a => `${a.name}=${a.currency}`).join(', ')}\n`);

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('❌ Error fetching ad accounts:', error.response?.data?.error?.message || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Step 4: Fetch campaigns
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

    const campaignsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,status,objective,created_time,updated_time',
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
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Step 5: Fetch ad sets
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
      `https://graph.facebook.com/${API_VERSION}/${campaignId}/adsets`,
      {
        params: {
          fields: 'id,name,status,daily_budget,lifetime_budget,created_time',
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

// Step 6: ENHANCED campaign insights with detailed logging and time-series data
app.post('/api/campaign-insights', async (req, res) => {
  try {
    const { campaignId, accessToken, dateStart, dateEnd } = req.body;

    if (!campaignId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'campaignId and accessToken are required'
      });
    }

    console.log(`\n📊 FETCHING INSIGHTS: Campaign ${campaignId}`);
    console.log(`📅 Date Range: ${dateStart} to ${dateEnd}`);

    // Default dates
    let start = dateStart;
    let end = dateEnd;
    
    if (!start || !end) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    }

    // REQUEST: Get aggregated insights
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${campaignId}/insights`,
      {
        params: {
          fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas,conversions,conversion_values,date_start,date_stop',
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

    console.log('📋 RAW RESPONSE FROM META:');
    console.log(JSON.stringify(insights, null, 2));

    // Parse purchase data - Multiple methods
    let purchases = 0;
    let purchaseValue = 0;
    let leads = 0;
    let rawROAS = 0;

    // METHOD 1: purchase_roas field
    if (insights.purchase_roas) {
      rawROAS = parseFloat(insights.purchase_roas);
      console.log(`✅ METHOD 1 - Found purchase_roas: ${rawROAS}`);
    }

    // METHOD 2: actions array (purchases or leads)
    if (insights.actions && Array.isArray(insights.actions)) {
      console.log(`📋 Actions array found with ${insights.actions.length} items:`);
      insights.actions.forEach(a => console.log(`   - ${a.action_type}: ${a.value}`));
      
      const purchaseAction = insights.actions.find(a => a.action_type === 'purchase');
      if (purchaseAction) {
        purchases = parseInt(purchaseAction.value || 0);
        console.log(`✅ METHOD 2 - Found purchase action: ${purchases}`);
      }

      const leadsAction = insights.actions.find(a => a.action_type === 'lead');
      if (leadsAction) {
        leads = parseInt(leadsAction.value || 0);
        console.log(`✅ METHOD 2 - Found leads action: ${leads}`);
      }
    }

    // METHOD 3: action_values array (purchase values)
    if (insights.action_values && Array.isArray(insights.action_values)) {
      console.log(`📋 Action_values array found with ${insights.action_values.length} items:`);
      insights.action_values.forEach(a => console.log(`   - ${a.action_type}: ${a.value}`));
      
      const purchaseValue_obj = insights.action_values.find(a => a.action_type === 'purchase');
      if (purchaseValue_obj) {
        purchaseValue = parseFloat(purchaseValue_obj.value || 0);
        console.log(`✅ METHOD 3 - Found purchase value: ${purchaseValue}`);
      }
    }

    // METHOD 4: conversion_values array
    if (purchaseValue === 0 && insights.conversion_values && Array.isArray(insights.conversion_values)) {
      console.log(`📋 Conversion_values array found with ${insights.conversion_values.length} items:`);
      insights.conversion_values.forEach(a => console.log(`   - ${a.action_type}: ${a.value}`));
      
      const conversionValue = insights.conversion_values.find(c => c.action_type === 'omni_purchase' || c.action_type === 'purchase');
      if (conversionValue) {
        purchaseValue = parseFloat(conversionValue.value || 0);
        console.log(`✅ METHOD 4 - Found conversion value: ${purchaseValue}`);
      }
    }

    // METHOD 5: conversions array
    if (purchases === 0 && insights.conversions && Array.isArray(insights.conversions)) {
      console.log(`📋 Conversions array found with ${insights.conversions.length} items:`);
      insights.conversions.forEach(c => console.log(`   - ${c.action_type}: ${c.value}`));
      
      const conversion = insights.conversions.find(c => c.action_type === 'purchase');
      if (conversion) {
        purchases = parseInt(conversion.value || 0);
        console.log(`✅ METHOD 5 - Found conversion count: ${purchases}`);
      }

      const leadsConversion = insights.conversions.find(c => c.action_type === 'lead');
      if (leadsConversion) {
        leads = parseInt(leadsConversion.value || 0);
        console.log(`✅ METHOD 5 - Found leads conversion: ${leads}`);
      }
    }

    // Calculate ROAS and CPL
    const spend = parseFloat(insights.spend || 0);
    let roas = 0;
    let cpl = 0;
    
    if (rawROAS > 0) {
      roas = rawROAS.toFixed(2);
      console.log(`💰 ROAS from Meta: ${roas}`);
    } else if (spend > 0 && purchaseValue > 0) {
      roas = (purchaseValue / spend).toFixed(2);
      console.log(`💰 ROAS calculated: ${roas}`);
    }

    if (leads > 0 && spend > 0) {
      cpl = (spend / leads).toFixed(2);
      console.log(`💰 CPL calculated: ${cpl}`);
    }

    console.log(`\n✅ FINAL METRICS:`);
    console.log(`   Spend: ${spend}`);
    console.log(`   Impressions: ${parseInt(insights.impressions || 0)}`);
    console.log(`   Clicks: ${parseInt(insights.clicks || 0)}`);
    console.log(`   CTR: ${parseFloat(insights.ctr || 0).toFixed(2)}`);
    console.log(`   CPC: ${parseFloat(insights.cpc || 0).toFixed(2)}`);
    console.log(`   Purchases: ${purchases}`);
    console.log(`   Purchase Value: ${purchaseValue}`);
    console.log(`   Leads: ${leads}`);
    console.log(`   CPL: ${cpl}`);
    console.log(`   ROAS: ${roas}\n`);

    res.json({
      success: true,
      data: {
        campaignId: campaignId,
        spend: spend,
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        ctr: parseFloat(insights.ctr || 0).toFixed(2),
        cpc: parseFloat(insights.cpc || 0).toFixed(2),
        purchases: purchases,
        purchaseValue: purchaseValue,
        roas: roas,
        leads: leads,
        cpl: cpl,
        dateRange: { start, end },
        rawData: {
          actions: insights.actions || [],
          action_values: insights.action_values || [],
          conversions: insights.conversions || [],
          conversion_values: insights.conversion_values || []
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching campaign insights:', error.response?.data?.error?.message || error.message);
    console.error('Full error:', error.response?.data);
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: {}
    });
  }
});

// Step 7: Fetch ad set insights (Stage 3B)
app.post('/api/adset-insights', async (req, res) => {
  try {
    const { adSetId, accessToken, dateStart, dateEnd } = req.body;

    if (!adSetId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adSetId and accessToken are required'
      });
    }

    console.log(`📊 Fetching insights for ad set: ${adSetId}`);

    let start = dateStart;
    let end = dateEnd;
    
    if (!start || !end) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    }

    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${adSetId}/insights`,
      {
        params: {
          fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas',
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

    let purchases = 0;
    let purchaseValue = 0;

    if (insights.actions && Array.isArray(insights.actions)) {
      const purchaseAction = insights.actions.find(a => a.action_type === 'purchase');
      if (purchaseAction) {
        purchases = parseInt(purchaseAction.value || 0);
      }
    }

    if (insights.action_values && Array.isArray(insights.action_values)) {
      const purchaseValue_obj = insights.action_values.find(a => a.action_type === 'purchase');
      if (purchaseValue_obj) {
        purchaseValue = parseFloat(purchaseValue_obj.value || 0);
      }
    }

    const spend = parseFloat(insights.spend || 0);
    const roas = spend > 0 ? (purchaseValue / spend).toFixed(2) : 0;

    console.log(`✅ Fetched insights for ad set ${adSetId}\n`);

    res.json({
      success: true,
      data: {
        adSetId: adSetId,
        spend: spend,
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        ctr: parseFloat(insights.ctr || 0).toFixed(2),
        cpc: parseFloat(insights.cpc || 0).toFixed(2),
        purchases: purchases,
        purchaseValue: purchaseValue,
        roas: roas,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching ad set insights:', error.response?.data?.error?.message || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: {}
    });
  }
});

// Step 7B: Fetch ads/creatives under ad set (Stage 3C) - SIMPLIFIED
app.post('/api/ads', async (req, res) => {
  try {
    const { adSetId, accessToken } = req.body;

    if (!adSetId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adSetId and accessToken are required'
      });
    }

    console.log(`\n📊 Fetching ads/creatives for ad set: ${adSetId}`);

    // Get all ads under this ad set
    const adsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${adSetId}/ads`,
      {
        params: {
          fields: 'id,name,status,created_time,adset_id',
          access_token: accessToken
        }
      }
    );

    let ads = adsResponse.data.data || [];
    console.log(`✅ Found ${ads.length} ads in ad set`);

    // For each ad, get its creative data
    const adsWithCreatives = await Promise.all(
      ads.map(async (ad) => {
        try {
          console.log(`\n🔍 Fetching creative for ad: ${ad.id}`);
          
          // Get the ad with creative info
          const adDetailsResponse = await axios.get(
            `https://graph.facebook.com/${API_VERSION}/${ad.id}`,
            {
              params: {
                fields: 'id,name,creative',
                access_token: accessToken
              }
            }
          );

          const adDetails = adDetailsResponse.data;
          console.log(`   Ad has creative:`, adDetails.creative?.id);

          // If creative exists, get its details
          if (adDetails.creative?.id) {
            try {
              console.log(`\n   🔗 Fetching creative ID: ${adDetails.creative.id}`);
              
              const creativeResponse = await axios.get(
                `https://graph.facebook.com/${API_VERSION}/${adDetails.creative.id}`,
                {
                  params: {
                    fields: 'id,name,object_story_spec,video_data',
                    access_token: accessToken
                  }
                }
              );

              const creative = creativeResponse.data;
              console.log(`   ✅ Creative fetched successfully`);
              console.log(`      ID: ${creative.id}`);
              console.log(`      Name: ${creative.name}`);
              console.log(`      Has object_story_spec: ${!!creative.object_story_spec}`);
              console.log(`      Has video_data: ${!!creative.video_data}`);

              // Extract ad copy and creative type
              let adCopy = 'No copy available';
              let creativeType = 'UNKNOWN';
              let headline = '';
              let description = '';

              // Check object_story_spec for text content
              if (creative.object_story_spec) {
                console.log(`      Parsing object_story_spec...`);
                
                if (creative.object_story_spec.link_data?.message) {
                  adCopy = creative.object_story_spec.link_data.message;
                  creativeType = 'STATIC';
                  console.log(`      ✅ Found message (copy)`);
                }
                if (creative.object_story_spec.link_data?.headline) {
                  headline = creative.object_story_spec.link_data.headline;
                  console.log(`      ✅ Found headline`);
                }
                if (creative.object_story_spec.link_data?.description) {
                  description = creative.object_story_spec.link_data.description;
                  console.log(`      ✅ Found description`);
                }
              } else {
                console.log(`      ⚠️ No object_story_spec found`);
              }

              // Check if it's a video
              if (creative.video_data) {
                creativeType = 'VIDEO';
                console.log(`      ✅ Detected VIDEO creative`);
              }

              console.log(`      Final adCopy length: ${adCopy.length}`);
              console.log(`      Final creativeType: ${creativeType}\n`);

              return {
                id: ad.id,
                name: ad.name,
                status: ad.status,
                created_time: ad.created_time,
                creativeId: creative.id,
                creativeName: creative.name,
                adCopy: adCopy,
                headline: headline,
                description: description,
                creativeType: creativeType,
                rawCreative: creative
              };
            } catch (creativeErr) {
              console.log(`   ❌ FAILED to fetch creative details`);
              console.log(`      Error: ${creativeErr.message}`);
              console.log(`      Status: ${creativeErr.response?.status}`);
              console.log(`      Response: ${JSON.stringify(creativeErr.response?.data)}\n`);
              
              return {
                id: ad.id,
                name: ad.name,
                status: ad.status,
                created_time: ad.created_time,
                creativeId: adDetails.creative.id,
                creativeName: 'Unknown Creative',
                adCopy: `Error: ${creativeErr.message}`,
                headline: '',
                description: '',
                creativeType: 'UNKNOWN',
                rawCreative: adDetails.creative
              };
            }
          } else {
            console.log(`   ⚠️ Ad has no creative attached`);
            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              created_time: ad.created_time,
              creativeId: null,
              creativeName: 'No Creative',
              adCopy: 'No creative attached',
              headline: '',
              description: '',
              creativeType: 'NONE',
              rawCreative: null
            };
          }
        } catch (err) {
          console.log(`   ❌ Error processing ad ${ad.id}:`, err.message);
          return {
            id: ad.id,
            name: ad.name,
            status: ad.status,
            created_time: ad.created_time,
            creativeId: null,
            creativeName: 'Error',
            adCopy: `Error: ${err.message}`,
            headline: '',
            description: '',
            creativeType: 'ERROR',
            rawCreative: null
          };
        }
      })
    );

    console.log(`\n✅ Successfully processed ${adsWithCreatives.length} ads with creative data\n`);

    res.json({
      success: true,
      data: adsWithCreatives,
      count: adsWithCreatives.length
    });
  } catch (error) {
    console.error('\n❌ Error fetching ads:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Step 8: Fetch creative insights (Stage 3C)
app.post('/api/creative-insights', async (req, res) => {
  try {
    const { adId, accessToken, dateStart, dateEnd } = req.body;

    if (!adId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adId and accessToken are required'
      });
    }

    console.log(`📊 Fetching insights for creative: ${adId}`);

    let start = dateStart;
    let end = dateEnd;
    
    if (!start || !end) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    }

    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${adId}/insights`,
      {
        params: {
          fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas,frequency',
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

    let purchases = 0;
    let purchaseValue = 0;

    if (insights.actions && Array.isArray(insights.actions)) {
      const purchaseAction = insights.actions.find(a => a.action_type === 'purchase');
      if (purchaseAction) {
        purchases = parseInt(purchaseAction.value || 0);
      }
    }

    if (insights.action_values && Array.isArray(insights.action_values)) {
      const purchaseValue_obj = insights.action_values.find(a => a.action_type === 'purchase');
      if (purchaseValue_obj) {
        purchaseValue = parseFloat(purchaseValue_obj.value || 0);
      }
    }

    const spend = parseFloat(insights.spend || 0);
    const roas = spend > 0 ? (purchaseValue / spend).toFixed(2) : 0;

    console.log(`✅ Fetched insights for creative ${adId}\n`);

    res.json({
      success: true,
      data: {
        adId: adId,
        spend: spend,
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        ctr: parseFloat(insights.ctr || 0).toFixed(2),
        cpc: parseFloat(insights.cpc || 0).toFixed(2),
        purchases: purchases,
        purchaseValue: purchaseValue,
        roas: roas,
        frequency: parseFloat(insights.frequency || 0).toFixed(2),
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching creative insights:', error.response?.data?.error?.message || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: {}
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📍 GET /api/health - Health check`);
  console.log(`📍 GET /api/auth/login-url - OAuth login`);
  console.log(`📍 GET /api/auth/callback - OAuth callback`);
  console.log(`📍 POST /api/ad-accounts - Get ad accounts`);
  console.log(`📍 POST /api/campaigns - Get campaigns`);
  console.log(`📍 POST /api/ad-sets - Get ad sets`);
  console.log(`📍 POST /api/ads - Get ads/creatives under ad set`);
  console.log(`📍 POST /api/campaign-insights - Get campaign metrics (with detailed logging)`);
  console.log(`📍 POST /api/adset-insights - Get ad set metrics`);
  console.log(`📍 POST /api/creative-insights - Get creative metrics\n`);
});
