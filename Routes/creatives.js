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

// Get all creatives for an account
router.get('/account/:accountId', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;

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
        ROUND(AVG(CAST(cm.roas AS DECIMAL)), 2) as avg_roas,
        ROUND(AVG(CAST(cm.cpa AS DECIMAL)), 2) as avg_cpa,
        ROUND(AVG(CAST(cm.ctr AS DECIMAL)), 2) as avg_ctr
      FROM creatives cr
      LEFT JOIN creative_metrics cm ON cr.id = cm.creative_id
      WHERE cr.meta_account_id = $1
      GROUP BY cr.id, cr.creative_name, cr.meta_creative_id, cr.creative_type, cr.status, cr.launched_date
      ORDER BY total_spend DESC`,
      [accountId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching creatives:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get creative lifecycle (age, fatigue status)
router.get('/:creativeId/lifecycle', authMiddleware, async (req, res) => {
  try {
    const creativeId = req.params.creativeId;

    const result = await db.query(
      `SELECT 
        cr.id,
        cr.creative_name,
        cr.launched_date,
        EXTRACT(DAY FROM NOW() - cr.launched_date)::INTEGER as age_in_days,
        cm.roas as latest_roas,
        (SELECT roas FROM creative_metrics WHERE creative_id = $1 ORDER BY metric_date DESC LIMIT 1 OFFSET 7)::DECIMAL as roas_7days_ago,
        cm.ctr as latest_ctr,
        cm.frequency as latest_frequency,
        cm.metric_date as latest_metric_date
      FROM creatives cr
      LEFT JOIN creative_metrics cm ON cr.id = cm.creative_id
      WHERE cr.id = $1
      ORDER BY cm.metric_date DESC LIMIT 1`,
      [creativeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creative not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching lifecycle:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;