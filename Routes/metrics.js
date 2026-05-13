const express = require('express');
const db = require('../config/database');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get campaign metrics for an account
router.get('/account/:accountId/campaigns', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;

    // Verify account access
    const accountResult = await db.query(
      `SELECT id FROM meta_accounts WHERE id = $1 AND workspace_id = $2`,
      [accountId, req.user.workspaceId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get campaigns with aggregated metrics
    const result = await db.query(
      `SELECT 
        c.id,
        c.campaign_name,
        c.meta_campaign_id,
        c.status,
        SUM(CAST(cm.spend AS DECIMAL)) as total_spend,
        SUM(CAST(cm.revenue AS DECIMAL)) as total_revenue,
        SUM(CAST(cm.conversions AS DECIMAL))::INTEGER as total_conversions,
        ROUND(AVG(CAST(cm.roas AS DECIMAL)), 2) as avg_roas,
        ROUND(AVG(CAST(cm.cpa AS DECIMAL)), 2) as avg_cpa,
        COUNT(DISTINCT as2.id) as ad_set_count,
        COUNT(DISTINCT cr.id) as creative_count
      FROM campaigns c
      LEFT JOIN ad_sets as2 ON c.id = as2.campaign_id
      LEFT JOIN creatives cr ON as2.id = cr.ad_set_id
      LEFT JOIN creative_metrics cm ON cr.id = cm.creative_id
      WHERE c.meta_account_id = $1
      GROUP BY c.id, c.campaign_name, c.meta_campaign_id, c.status
      ORDER BY total_spend DESC`,
      [accountId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get ad set metrics for a campaign
router.get('/campaign/:campaignId/adsets', authMiddleware, async (req, res) => {
  try {
    const campaignId = req.params.campaignId;

    const result = await db.query(
      `SELECT 
        as2.id,
        as2.ad_set_name,
        as2.meta_ad_set_id,
        as2.daily_budget,
        as2.status,
        SUM(CAST(cm.spend AS DECIMAL)) as total_spend,
        SUM(CAST(cm.revenue AS DECIMAL)) as total_revenue,
        SUM(CAST(cm.conversions AS DECIMAL))::INTEGER as total_conversions,
        SUM(CAST(cm.impressions AS DECIMAL))::INTEGER as total_impressions,
        ROUND(AVG(CAST(cm.roas AS DECIMAL)), 2) as avg_roas,
        ROUND(AVG(CAST(cm.cpa AS DECIMAL)), 2) as avg_cpa,
        COUNT(DISTINCT cr.id) as creative_count
      FROM ad_sets as2
      LEFT JOIN creatives cr ON as2.id = cr.ad_set_id
      LEFT JOIN creative_metrics cm ON cr.id = cm.creative_id
      WHERE as2.campaign_id = $1
      GROUP BY as2.id, as2.ad_set_name, as2.meta_ad_set_id, as2.daily_budget, as2.status
      ORDER BY total_spend DESC`,
      [campaignId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ad sets:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get creative metrics for an ad set
router.get('/adset/:adSetId/creatives', authMiddleware, async (req, res) => {
  try {
    const adSetId = req.params.adSetId;

    const result = await db.query(
      `SELECT 
        cr.id,
        cr.creative_name,
        cr.meta_creative_id,
        cr.creative_type,
        cr.status,
        cr.launched_date,
        SUM(CAST(cm.spend AS DECIMAL)) as total_spend,
        SUM(CAST(cm.revenue AS DECIMAL)) as total_revenue,
        SUM(CAST(cm.conversions AS DECIMAL))::INTEGER as total_conversions,
        SUM(CAST(cm.impressions AS DECIMAL))::INTEGER as total_impressions,
        SUM(CAST(cm.clicks AS DECIMAL))::INTEGER as total_clicks,
        ROUND(AVG(CAST(cm.roas AS DECIMAL)), 2) as avg_roas,
        ROUND(AVG(CAST(cm.cpa AS DECIMAL)), 2) as avg_cpa,
        ROUND(AVG(CAST(cm.ctr AS DECIMAL)), 2) as avg_ctr,
        ROUND(AVG(CAST(cm.frequency AS DECIMAL)), 2) as avg_frequency
      FROM creatives cr
      LEFT JOIN creative_metrics cm ON cr.id = cm.creative_id
      WHERE cr.ad_set_id = $1
      GROUP BY cr.id, cr.creative_name, cr.meta_creative_id, cr.creative_type, cr.status, cr.launched_date
      ORDER BY total_spend DESC`,
      [adSetId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching creatives:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed metrics for a single creative
router.get('/creative/:creativeId/details', authMiddleware, async (req, res) => {
  try {
    const creativeId = req.params.creativeId;

    // Get creative info
    const creativeResult = await db.query(
      `SELECT * FROM creatives WHERE id = $1`,
      [creativeId]
    );

    if (creativeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Creative not found' });
    }

    // Get historical metrics (last 30 days)
    const metricsResult = await db.query(
      `SELECT * FROM creative_metrics WHERE creative_id = $1 ORDER BY metric_date DESC LIMIT 30`,
      [creativeId]
    );

    res.json({
      creative: creativeResult.rows[0],
      metrics_history: metricsResult.rows.reverse()
    });
  } catch (error) {
    console.error('Error fetching creative details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;