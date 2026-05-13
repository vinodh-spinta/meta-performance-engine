const axios = require('axios');
const db = require('../config/database');
const { decrypt } = require('../utils/encryption');

const META_API_VERSION = process.env.META_API_VERSION || 'v18.0';
const GRAPH_API_URL = process.env.META_GRAPH_API_URL || 'https://graph.instagram.com';

// Fetch all campaigns for an ad account
const fetchCampaigns = async (adAccountId, accessToken) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${META_API_VERSION}/act_${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,objective,status,created_time',
          access_token: accessToken
        }
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    return [];
  }
};

// Fetch ad sets for a campaign
const fetchAdSets = async (campaignId, accessToken) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${META_API_VERSION}/${campaignId}/adsets`,
      {
        params: {
          fields: 'id,name,daily_budget,status,targeting',
          access_token: accessToken
        }
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching ad sets:', error.message);
    return [];
  }
};

// Fetch creatives (ads) for an ad set
const fetchCreatives = async (adSetId, accessToken) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${META_API_VERSION}/${adSetId}/ads`,
      {
        params: {
          fields: 'id,name,creative,adset_id,status,created_time',
          access_token: accessToken
        }
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching creatives:', error.message);
    return [];
  }
};

// Fetch insights (metrics) for a creative
const fetchCreativeMetrics = async (creativeId, accessToken, dateStart, dateEnd) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${META_API_VERSION}/${creativeId}/insights`,
      {
        params: {
          fields: 'impressions,clicks,conversions,spend,action_values,frequency',
          time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
          access_token: accessToken
        }
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching creative metrics:', error.message);
    return [];
  }
};

// Fetch conversion events (for journey tracking)
const fetchConversionEvents = async (adAccountId, accessToken, dateStart) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${META_API_VERSION}/act_${adAccountId}/conversions`,
      {
        params: {
          fields: 'id,user_id,conversion_event,conversion_value,conversion_date,click_id,ad_id,adset_id,campaign_id',
          time_range: JSON.stringify({ since: dateStart }),
          access_token: accessToken,
          limit: 10000
        }
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching conversion events:', error.message);
    return [];
  }
};

// Main function: Sync all data for all connected accounts
const fetchAllAccountMetrics = async () => {
  try {
    // Get all active Meta accounts
    const accountsResult = await db.query(
      `SELECT id, ad_account_id, encrypted_access_token FROM meta_accounts WHERE account_status = 'active'`
    );

    for (const account of accountsResult.rows) {
      console.log(`Syncing account: ${account.ad_account_id}`);
      
      // Decrypt token
      const accessToken = decrypt(account.encrypted_access_token);

      // Fetch campaigns
      const campaigns = await fetchCampaigns(account.ad_account_id, accessToken);
      
      for (const campaign of campaigns) {
        // Store campaign
        await db.query(
          `INSERT INTO campaigns (meta_account_id, meta_campaign_id, campaign_name, objective, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [account.id, campaign.id, campaign.name, campaign.objective, campaign.status]
        );

        // Fetch ad sets for this campaign
        const adSets = await fetchAdSets(campaign.id, accessToken);
        
        for (const adSet of adSets) {
          // Store ad set
          const campaignResult = await db.query(
            `SELECT id FROM campaigns WHERE meta_campaign_id = $1`,
            [campaign.id]
          );
          
          if (campaignResult.rows.length > 0) {
            await db.query(
              `INSERT INTO ad_sets (campaign_id, meta_ad_set_id, ad_set_name, daily_budget, status, targeting_json)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [campaignResult.rows[0].id, adSet.id, adSet.name, adSet.daily_budget, adSet.status, JSON.stringify(adSet.targeting || {})]
            );

            // Fetch creatives for this ad set
            const creatives = await fetchCreatives(adSet.id, accessToken);
            
            for (const creative of creatives) {
              // Store creative
              const adSetResult = await db.query(
                `SELECT id FROM ad_sets WHERE meta_ad_set_id = $1`,
                [adSet.id]
              );
              
              if (adSetResult.rows.length > 0) {
                await db.query(
                  `INSERT INTO creatives (meta_account_id, meta_creative_id, creative_name, ad_set_id, status, launched_date)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT DO NOTHING`,
                  [account.id, creative.id, creative.name, adSetResult.rows[0].id, creative.status, creative.created_time]
                );

                // Fetch metrics for this creative (last 30 days)
                const dateEnd = new Date().toISOString().split('T')[0];
                const dateStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const metrics = await fetchCreativeMetrics(creative.id, accessToken, dateStart, dateEnd);
                
                if (metrics.length > 0) {
                  // Store metrics
                  const creativeResult = await db.query(
                    `SELECT id FROM creatives WHERE meta_creative_id = $1`,
                    [creative.id]
                  );
                  
                  if (creativeResult.rows.length > 0) {
                    // Calculate derived metrics
                    const metric = metrics[0];
                    const impressions = metric.impressions || 0;
                    const clicks = metric.clicks || 0;
                    const conversions = metric.conversions || 0;
                    const spend = parseFloat(metric.spend) || 0;
                    const revenue = metric.action_values ? metric.action_values[0] : 0;
                    
                    const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0;
                    const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : 0;
                    const cpa = conversions > 0 ? (spend / conversions).toFixed(2) : 0;
                    const roas = spend > 0 ? (revenue / spend).toFixed(2) : 0;
                    const frequency = metric.frequency || 0;

                    await db.query(
                      `INSERT INTO creative_metrics 
                       (creative_id, metric_date, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, frequency)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                       ON CONFLICT (creative_id, metric_date) DO UPDATE SET
                       impressions = $3, clicks = $4, conversions = $5, spend = $6, revenue = $7, ctr = $8, cpc = $9, cpa = $10, roas = $11, frequency = $12`,
                      [creativeResult.rows[0].id, dateEnd, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, frequency]
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Fetch conversion events for journey tracking
      const dateStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const conversions = await fetchConversionEvents(account.ad_account_id, accessToken, dateStart);
      
      // Store conversion events and build journeys
      for (const conversion of conversions) {
        // Simple journey tracking: store conversion with creative info
        await db.query(
          `INSERT INTO user_journeys (meta_account_id, user_id, journey_path, conversion_event, conversion_value, conversion_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [account.id, conversion.user_id || conversion.click_id, [conversion.ad_id], conversion.conversion_event, conversion.conversion_value, conversion.conversion_date]
        );
      }

      // Update last sync time
      await db.query(
        `UPDATE meta_accounts SET last_synced = NOW() WHERE id = $1`,
        [account.id]
      );

      console.log(`✅ Synced account: ${account.ad_account_id}`);
    }
  } catch (error) {
    console.error('Error in fetchAllAccountMetrics:', error.message);
  }
};

module.exports = {
  fetchCampaigns,
  fetchAdSets,
  fetchCreatives,
  fetchCreativeMetrics,
  fetchConversionEvents,
  fetchAllAccountMetrics
};