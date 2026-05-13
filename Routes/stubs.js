const express = require('express');
const db = require('../config/database');

// Journeys routes
const journeyRouter = express.Router();
journeyRouter.get('/account/:accountId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM user_journeys WHERE meta_account_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.accountId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Goals routes
const goalsRouter = express.Router();
goalsRouter.get('/account/:accountId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT q1_revenue_target, q2_revenue_target, q3_revenue_target, q4_revenue_target FROM client_settings WHERE meta_account_id = $1`,
      [req.params.accountId]
    );
    res.json(result.rows.length > 0 ? result.rows[0] : {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Executions routes
const executionsRouter = express.Router();
executionsRouter.get('/account/:accountId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, r.recommendation_type, cr.creative_name 
       FROM executions e
       JOIN recommendations r ON e.recommendation_id = r.id
       JOIN creatives cr ON e.creative_id = cr.id
       WHERE cr.meta_account_id = $1
       ORDER BY e.executed_at DESC LIMIT 50`,
      [req.params.accountId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  journeyRouter,
  goalsRouter,
  executionsRouter
};