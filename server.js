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
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://meta-performance--ads.vercel.app/callback';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

console.log('=== META OAUTH CONFIG ===');
console.log('App ID:', META_APP_ID);
console.log('App Secret:', META_APP_SECRET ? '***SET***' : '***NOT SET***');
console.log('Redirect URI:', REDIRECT_URI);
console.log('Claude API Key:', CLAUDE_API_KEY ? '***SET***' : '***NOT SET***');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Step 1: Generate login URL
app.get('/api/auth/login-url', (req, res) => {
  try {
    const scope = 'ads_management,read_insights';
    const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=random_state_${Date.now()}`;

    console.log('Generated login URL');
    res.json({ success: true, loginUrl });
  } catch (error) {
    console.error('Error generating login URL:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 2: Exchange code for access token
app.post('/api/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      console.error('No code provided');
      return res.status(400).json({ success: false, error: 'No authorization code' });
    }

    console.log('Exchanging code for access token...');

    // Exchange code for token
    const tokenResponse = await axios.get(
      'https://graph.instagram.com/v18.0/oauth/access_token',
      {
        params: {
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    console.log('✅ Access token obtained for user:', userId);

    // Get user info
    const userResponse = await axios.get(
      `https://graph.instagram.com/v18.0/${userId}`,
      {
        params: {
          fields: 'id,name,email',
          access_token: accessToken
        }
      }
    );

    console.log('✅ User info retrieved:', userResponse.data.name);

    res.json({
      success: true,
      accessToken: accessToken,
      user: {
        id: userResponse.data.id,
        name: userResponse.data.name,
        email: userResponse.data.email
      }
    });
  } catch (error) {
    console.error('❌ OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error_description || error.message
    });
  }
});

// Step 3: Fetch campaigns using access token + Claude + Meta MCP
app.post('/api/campaigns', async (req, res) => {
  try {
    const { adAccountId, accessToken } = req.body;

    if (!adAccountId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId and accessToken required'
      });
    }

    console.log(`Fetching campaigns for account: ${adAccountId}`);

    // Directly call Meta Graph API with user's token
    const campaignsResponse = await axios.get(
      `https://graph.instagram.com/v18.0/act_${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,objective,status,created_time,updated_time',
          access_token: accessToken
        }
      }
    );

    const campaigns = campaignsResponse.data.data || [];
    console.log(`✅ Fetched ${campaigns.length} campaigns`);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('❌ Campaign fetch error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      data: []
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    config: {
      appId: META_APP_ID,
      redirectUri: REDIRECT_URI,
      hasAppSecret: !!META_APP_SECRET,
      hasClaudeKey: !!CLAUDE_API_KEY
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  console.log(`📍 GET /api/health - Health check`);
  console.log(`📍 GET /api/auth/login-url - Get login URL`);
  console.log(`📍 POST /api/auth/callback - OAuth callback`);
  console.log(`📍 POST /api/campaigns - Fetch campaigns\n`);
});
