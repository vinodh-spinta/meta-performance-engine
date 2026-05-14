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

// Meta App Credentials
const META_APP_ID = process.env.META_APP_ID || '1601962987562179';
const META_APP_SECRET = process.env.META_APP_SECRET || 'YOUR_APP_SECRET_HERE';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://meta-performance--ads.vercel.app/callback';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Generate OAuth login URL
app.get('/api/auth/login-url', (req, res) => {
  try {
    const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_management,read_insights&response_type=code&state=random_state_string`;
    
    res.json({
      success: true,
      loginUrl: loginUrl
    });
  } catch (error) {
    console.error('Error generating login URL:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle OAuth callback and exchange code for access token
app.post('/api/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'No authorization code provided' });
    }

    console.log('Exchanging code for access token...');

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.instagram.com/v18.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    console.log('Access token obtained for user:', userId);

    // Get user info
    const userResponse = await axios.get(`https://graph.instagram.com/v18.0/${userId}`, {
      params: {
        fields: 'id,name,email',
        access_token: accessToken
      }
    });

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
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error_description || error.message
    });
  }
});

// Fetch campaigns using Meta access token + Claude + Meta MCP
const fetchCampaignsWithToken = async (adAccountId, accessToken) => {
  try {
    // Use Claude to fetch campaigns via Meta MCP with the user's access token
    const prompt = `You have access to Meta Ads Manager through the Meta Ads MCP server.

The user has provided their Meta access token: ${accessToken}

Please fetch all campaigns for ad account ID: ${adAccountId}

Use the ads_get_ad_entities tool with these parameters:
- entity_type: "CAMPAIGN"
- ad_account_id: "act_${adAccountId}"
- fields: ["id", "name", "objective", "status", "created_time", "updated_time"]

Return ONLY valid JSON with no extra text:
{
  "success": true,
  "data": [
    {
      "id": "campaign_id",
      "name": "campaign_name",
      "objective": "CONVERSIONS",
      "status": "ACTIVE",
      "created_time": "2024-01-01T00:00:00+0000",
      "updated_time": "2024-01-01T00:00:00+0000"
    }
  ]
}

If error occurs, return:
{
  "success": false,
  "error": "error message",
  "data": []
}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        mcp_servers: [
          {
            type: 'url',
            url: 'https://mcp.facebook.com/ads',
            name: 'meta-ads-mcp'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const content = response.data.content[0]?.text;
    if (!content) {
      throw new Error('No response from Claude');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Fetch campaigns endpoint (requires access token)
app.post('/api/campaigns', async (req, res) => {
  try {
    const { adAccountId, accessToken } = req.body;

    if (!adAccountId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId and accessToken are required'
      });
    }

    console.log(`Fetching campaigns for ad account: ${adAccountId}`);

    const result = await fetchCampaignsWithToken(adAccountId, accessToken);

    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Backend with Meta OAuth is running'
  });
});

// Test Claude + Meta MCP connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const testPrompt = 'You have access to Meta Ads Manager. Please confirm you can access Meta MCP by responding with just "OK".';

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ],
        mcp_servers: [
          {
            type: 'url',
            url: 'https://mcp.facebook.com/ads',
            name: 'meta-ads-mcp'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    res.json({
      success: true,
      message: 'Claude + Meta MCP connection is working',
      response: response.data.content[0]?.text
    });
  } catch (error) {
    console.error('Test connection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Connection test failed'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ error: err.message, success: false });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend with Meta OAuth running on port ${PORT}`);
  console.log(`✅ Meta App ID: ${META_APP_ID}`);
  console.log(`✅ Redirect URI: ${REDIRECT_URI}`);
  console.log(`✅ Claude API Key: ${CLAUDE_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`📍 Login URL: GET /api/auth/login-url`);
  console.log(`📍 OAuth Callback: POST /api/auth/callback`);
  console.log(`📍 Fetch Campaigns: POST /api/campaigns`);
  console.log(`📍 Test Connection: GET /api/test-connection`);
});
