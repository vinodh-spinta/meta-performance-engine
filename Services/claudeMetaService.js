const axios = require('axios');

// Call Claude API which uses Meta Ads MCP to fetch real Meta data
const callClaudeMetaAPI = async (prompt) => {
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
    console.error('Error calling Claude API:', error.message);
    throw error;
  }
};

// Fetch campaigns for a Meta Ad Account using Claude API
const fetchCampaignsViaClaudeAPI = async (adAccountId) => {
  try {
    const prompt = `
You have access to Meta Ads Manager via the Meta Ads MCP tool. 
Please fetch all campaigns for ad account ID: ${adAccountId}

Use the ads_get_ad_entities tool with these parameters:
- entity_type: "CAMPAIGN"
- ad_account_id: "act_${adAccountId}"
- fields: ["id", "name", "objective", "status", "created_time", "spend", "impressions", "clicks", "conversions", "action_values"]

Return the response as JSON with this structure:
{
  "campaigns": [
    {
      "id": "...",
      "name": "...",
      "objective": "...",
      "status": "...",
      "spend": number,
      "impressions": number,
      "clicks": number,
      "conversions": number,
      "action_values": number
    }
  ]
}

If the API returns an error, return:
{
  "error": "error message",
  "campaigns": []
}
`;

    const result = await callClaudeMetaAPI(prompt);
    
    // Parse JSON response from Claude
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { campaigns: [], error: 'Could not parse response' };
  } catch (error) {
    console.error('Error fetching campaigns via Claude:', error.message);
    return { campaigns: [], error: error.message };
  }
};

// Fetch ad metrics for a campaign
const fetchCampaignMetrics = async (campaignId, adAccountId) => {
  try {
    const prompt = `
You have access to Meta Ads Manager via the Meta Ads MCP tool.
Please fetch detailed metrics for campaign ID: ${campaignId}

Use the ads_insights_* tools to get:
- Campaign performance (spend, impressions, clicks, conversions)
- ROAS (revenue / spend)
- CPA (spend / conversions)
- CTR (clicks / impressions)

Return as JSON with this structure:
{
  "campaign_id": "${campaignId}",
  "spend": number,
  "impressions": number,
  "clicks": number,
  "conversions": number,
  "revenue": number,
  "roas": number,
  "cpa": number,
  "ctr": number
}
`;

    const result = await callClaudeMetaAPI(prompt);
    
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { campaign_id: campaignId, error: 'Could not parse response' };
  } catch (error) {
    console.error('Error fetching campaign metrics via Claude:', error.message);
    return { campaign_id: campaignId, error: error.message };
  }
};

// Fetch all creatives for an account
const fetchCreativesViaClaudeAPI = async (adAccountId) => {
  try {
    const prompt = `
You have access to Meta Ads Manager via the Meta Ads MCP tool.
Please fetch all creatives (ads) for ad account ID: ${adAccountId}

Use the ads_get_ad_entities tool to fetch all ads with these fields:
- id
- name
- status
- creative
- adset_id
- created_time
- impressions
- clicks
- spend
- conversions
- ctr
- cpc

Return as JSON:
{
  "creatives": [
    {
      "id": "...",
      "name": "...",
      "status": "...",
      "adset_id": "...",
      "age_in_days": number,
      "impressions": number,
      "clicks": number,
      "spend": number,
      "conversions": number,
      "ctr": number,
      "cpc": number,
      "roas": number,
      "cpa": number
    }
  ]
}
`;

    const result = await callClaudeMetaAPI(prompt);
    
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { creatives: [] };
  } catch (error) {
    console.error('Error fetching creatives via Claude:', error.message);
    return { creatives: [], error: error.message };
  }
};

module.exports = {
  callClaudeMetaAPI,
  fetchCampaignsViaClaudeAPI,
  fetchCampaignMetrics,
  fetchCreativesViaClaudeAPI
};
