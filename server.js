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

// Call Claude API with Meta MCP server configured
const callClaudeWithMetaMCP = async (prompt) => {
  try {
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
        // CRITICAL: Tell Claude API to use Meta MCP
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

    if (response.data.content && response.data.content[0]) {
      return response.data.content[0].text;
    }
    return null;
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Fetch campaigns for an ad account
app.get('/api/campaigns/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    console.log(`Fetching campaigns for ad account: ${adAccountId}`);
    
    const prompt = `You have access to Meta Ads Manager through the Meta Ads MCP server at https://mcp.facebook.com/ads.

Please fetch all campaigns for ad account ID: ${adAccountId}

Use the ads_get_ad_entities tool with these exact parameters:
- entity_type: "CAMPAIGN"
- ad_account_id: "act_${adAccountId}"
- fields: ["id", "name", "objective", "status", "created_time"]

Return ONLY a valid JSON object in this format, nothing else:
{
  "campaigns": [
    {
      "id": "...",
      "name": "...",
      "objective": "...",
      "status": "..."
    }
  ]
}

If there's an error, return:
{
  "error": "error message",
  "campaigns": []
}`;

    const result = await callClaudeWithMetaMCP(prompt);
    
    if (!result) {
      return res.status(500).json({ error: 'No response from Claude', campaigns: [] });
    }

    // Extract JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return res.json(data);
    }
    
    return res.json({ campaigns: [], message: 'Could not parse response' });
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    res.status(500).json({ error: error.message, campaigns: [] });
  }
});

// Test Claude API and Meta MCP connection
app.get('/api/test', async (req, res) => {
  try {
    const prompt = 'What is 2+2? Respond with just the number.';
    const result = await callClaudeWithMetaMCP(prompt);
    
    res.json({ 
      success: true,
      message: 'Claude API with Meta MCP is working',
      result: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Claude API test failed'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Claude API Key: ${process.env.CLAUDE_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`Meta MCP Server: https://mcp.facebook.com/ads`);
});
