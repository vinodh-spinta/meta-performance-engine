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

// Call Claude API with Meta MCP - fetch real data
const fetchFromMetaViaClaude = async (adAccountId, dataType = 'campaigns') => {
  try {
    let prompt = '';

    if (dataType === 'campaigns') {
      prompt = `You are connected to Meta Ads Manager via Meta MCP at https://mcp.facebook.com/ads.

I need you to fetch ALL campaigns from Meta ad account: ${adAccountId}

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
    }

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
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Extract response from Claude
    const content = response.data.content[0]?.text;
    if (!content) {
      throw new Error('No response from Claude');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error fetching from Meta via Claude:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'Backend is running' });
});

// Fetch campaigns from any Meta ad account
app.post('/api/fetch-campaigns', async (req, res) => {
  try {
    const { adAccountId } = req.body;

    if (!adAccountId) {
      return res.status(400).json({ error: 'adAccountId is required', success: false });
    }

    console.log(`Fetching campaigns for ad account: ${adAccountId}`);

    const result = await fetchFromMetaViaClaude(adAccountId, 'campaigns');

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

// Test connection to Claude + Meta MCP
app.get('/api/test-connection', async (req, res) => {
  try {
    const testPrompt = `You have access to Meta Ads Manager. Please list the first 3 tools available to you from the Meta Ads MCP server. Return only a simple JSON list with tool names.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
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
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const content = response.data.content[0]?.text;

    res.json({
      success: true,
      message: 'Claude + Meta MCP connection is working',
      response: content
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ error: err.message, success: false });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Claude API Key: ${process.env.CLAUDE_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`✅ Meta MCP Server: https://mcp.facebook.com/ads`);
  console.log(`📍 Health check: GET /api/health`);
  console.log(`📍 Fetch campaigns: POST /api/fetch-campaigns (body: {adAccountId: "xxxxx"})`);
  console.log(`📍 Test connection: GET /api/test-connection`);
});
