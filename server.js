require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const claudeMetaService = require('./Services/claudeMetaService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Fetch campaigns for an ad account (REAL Meta data via Claude API)
app.get('/api/campaigns/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    
    console.log(`Fetching campaigns for ad account: ${adAccountId}`);
    
    const result = await claudeMetaService.fetchCampaignsViaClaudeAPI(adAccountId);
    
    if (result.error) {
      console.error('Error from Claude API:', result.error);
      return res.status(400).json({ error: result.error, campaigns: [] });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch creatives (ads) for an account
app.get('/api/creatives/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    
    console.log(`Fetching creatives for ad account: ${adAccountId}`);
    
    const result = await claudeMetaService.fetchCreativesViaClaudeAPI(adAccountId);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching creatives:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch metrics for a specific campaign
app.get('/api/campaign-metrics/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { adAccountId } = req.query;
    
    if (!adAccountId) {
      return res.status(400).json({ error: 'adAccountId query parameter is required' });
    }
    
    console.log(`Fetching metrics for campaign: ${campaignId}`);
    
    const result = await claudeMetaService.fetchCampaignMetrics(campaignId, adAccountId);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching campaign metrics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Test Claude API connection
app.get('/api/claude/test', async (req, res) => {
  try {
    const testPrompt = 'What is 2+2? Respond with just the number.';
    const result = await claudeMetaService.callClaudeMetaAPI(testPrompt);
    
    res.json({ 
      success: true,
      message: 'Claude API is connected',
      testResult: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Claude API test failed. Make sure CLAUDE_API_KEY is set.'
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
  console.log(`Claude API Key configured: ${process.env.CLAUDE_API_KEY ? 'YES' : 'NO'}`);
});
