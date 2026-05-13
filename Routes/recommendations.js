const express = require('express');
const db = require('../config/database');
const axios = require('axios');
const { decrypt } = require('../utils/encryption');
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

// Get pending recommendations for an account
router.get('/account/:accountId', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const status = req.query.status || 'pending';

    const result = await db.query(
      `SELECT 
        r.id,
        r.creative_id,
        r.recommendation_type,
        r.action_description,
        r.reasoning,
        r.expected_impact,
        r.confidence_score,
        r.current_spend,
        r.recommended_spend,
        r.status,
        cr.creative_name,
        cr.creative_type
      FROM recommendations r
      JOIN creatives cr ON r.creative_id = cr.id
      WHERE cr.meta_account_id = $1 AND r.status = $2
      ORDER BY r.confidence_score DESC`,
      [accountId, status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Approve a recommendation
router.post('/:recommendationId/approve', authMiddleware, async (req, res) => {
  try {
    const recommendationId = req.params.recommendationId;

    // Get recommendation
    const recResult = await db.query(
      `SELECT r.*, cr.meta_account_id FROM recommendations r
       JOIN creatives cr ON r.creative_id = cr.id
       WHERE r.id = $1`,
      [recommendationId]
    );

    if (recResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const recommendation = recResult.rows[0];

    // Get account and token
    const accountResult = await db.query(
      `SELECT ad_account_id, encrypted_access_token FROM meta_accounts WHERE id = $1`,
      [recommendation.meta_account_id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];
    const accessToken = decrypt(account.encrypted_access_token);

    // Execute in Meta (pause/scale budget)
    let executionResult = { success: false };
    let metaResponse = null;

    try {
      // Get creative's ad set ID
      const creativeResult = await db.query(
        `SELECT ad_set_id FROM creatives WHERE id = $1`,
        [recommendation.creative_id]
      );

      if (creativeResult.rows.length === 0) {
        throw new Error('Creative not found');
      }

      const adSetId = creativeResult.rows[0].ad_set_id;
      const adSetResult = await db.query(
        `SELECT meta_ad_set_id FROM ad_sets WHERE id = $1`,
        [adSetId]
      );

      const metaAdSetId = adSetResult.rows[0].meta_ad_set_id;

      // Execute action
      if (recommendation.recommendation_type === 'PAUSE') {
        metaResponse = await axios.post(
          `https://graph.instagram.com/v18.0/${metaAdSetId}`,
          { status: 'PAUSED' },
          { params: { access_token: accessToken } }
        );
        executionResult.success = true;
      } else if (recommendation.recommendation_type === 'SCALE_UP') {
        const dailyBudget = (recommendation.recommended_spend / 30) * 100;
        metaResponse = await axios.post(
          `https://graph.instagram.com/v18.0/${metaAdSetId}`,
          { daily_budget: Math.round(dailyBudget) },
          { params: { access_token: accessToken } }
        );
        executionResult.success = true;
      } else if (recommendation.recommendation_type === 'SCALE_DOWN') {
        const dailyBudget = (recommendation.recommended_spend / 30) * 100;
        metaResponse = await axios.post(
          `https://graph.instagram.com/v18.0/${metaAdSetId}`,
          { daily_budget: Math.round(dailyBudget) },
          { params: { access_token: accessToken } }
        );
        executionResult.success = true;
      }
    } catch (error) {
      executionResult.error = error.message;
    }

    // Update recommendation status
    const newStatus = executionResult.success ? 'executed' : 'failed';
    await db.query(
      `UPDATE recommendations SET status = $1, execution_date = NOW() WHERE id = $2`,
      [newStatus, recommendationId]
    );

    // Log execution
    await db.query(
      `INSERT INTO executions 
       (recommendation_id, action_type, creative_id, status, meta_response, executed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recommendationId, recommendation.recommendation_type, recommendation.creative_id, newStatus, JSON.stringify(metaResponse), req.user.userId]
    );

    res.json({
      success: executionResult.success,
      status: newStatus,
      message: executionResult.success ? 'Recommendation executed successfully' : 'Execution failed: ' + executionResult.error
    });
  } catch (error) {
    console.error('Error approving recommendation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Reject a recommendation
router.post('/:recommendationId/reject', authMiddleware, async (req, res) => {
  try {
    const recommendationId = req.params.recommendationId;

    await db.query(
      `UPDATE recommendations SET status = 'rejected' WHERE id = $1`,
      [recommendationId]
    );

    res.json({ success: true, message: 'Recommendation rejected' });
  } catch (error) {
    console.error('Error rejecting recommendation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;