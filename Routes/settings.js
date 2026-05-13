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

// Get settings for an account
router.get('/account/:accountId', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;

    const result = await db.query(
      `SELECT * FROM client_settings WHERE meta_account_id = $1`,
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.json({
        meta_account_id: accountId,
        q1_revenue_target: null,
        q2_revenue_target: null,
        q3_revenue_target: null,
        q4_revenue_target: null,
        max_monthly_spend: null,
        min_roas_threshold: 2.0,
        max_cpa: 50,
        current_inventory: null,
        restock_date: null,
        restock_lead_time_days: null,
        auto_pause_at_stock: null,
        mode: 'scaling',
        auto_mode_switch: true,
        cogs_per_unit: null,
        avg_order_value: null
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/account/:accountId', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const {
      q1_revenue_target,
      q2_revenue_target,
      q3_revenue_target,
      q4_revenue_target,
      max_monthly_spend,
      min_roas_threshold,
      max_cpa,
      current_inventory,
      restock_date,
      restock_lead_time_days,
      auto_pause_at_stock,
      mode,
      auto_mode_switch,
      cogs_per_unit,
      avg_order_value
    } = req.body;

    // Check if settings exist
    const existsResult = await db.query(
      `SELECT id FROM client_settings WHERE meta_account_id = $1`,
      [accountId]
    );

    let result;
    if (existsResult.rows.length === 0) {
      // Insert
      result = await db.query(
        `INSERT INTO client_settings 
         (meta_account_id, q1_revenue_target, q2_revenue_target, q3_revenue_target, q4_revenue_target, max_monthly_spend, min_roas_threshold, max_cpa, current_inventory, restock_date, restock_lead_time_days, auto_pause_at_stock, mode, auto_mode_switch, cogs_per_unit, avg_order_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [accountId, q1_revenue_target, q2_revenue_target, q3_revenue_target, q4_revenue_target, max_monthly_spend, min_roas_threshold, max_cpa, current_inventory, restock_date, restock_lead_time_days, auto_pause_at_stock, mode || 'scaling', auto_mode_switch !== false, cogs_per_unit, avg_order_value]
      );
    } else {
      // Update
      result = await db.query(
        `UPDATE client_settings SET 
         q1_revenue_target = $2, q2_revenue_target = $3, q3_revenue_target = $4, q4_revenue_target = $5, max_monthly_spend = $6, min_roas_threshold = $7, max_cpa = $8, current_inventory = $9, restock_date = $10, restock_lead_time_days = $11, auto_pause_at_stock = $12, mode = $13, auto_mode_switch = $14, cogs_per_unit = $15, avg_order_value = $16, updated_at = NOW()
         WHERE meta_account_id = $1
         RETURNING *`,
        [accountId, q1_revenue_target, q2_revenue_target, q3_revenue_target, q4_revenue_target, max_monthly_spend, min_roas_threshold, max_cpa, current_inventory, restock_date, restock_lead_time_days, auto_pause_at_stock, mode || 'scaling', auto_mode_switch !== false, cogs_per_unit, avg_order_value]
      );
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating settings:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;