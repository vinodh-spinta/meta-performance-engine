const express = require('express');
const db = require('../config/database');
const { encrypt } = require('../utils/encryption');
const { fetchAllAccountMetrics } = require('../services/metaService');
const router = express.Router();

// Middleware to verify JWT
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

// Get all accounts for user's workspace
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, account_name, ad_account_id, account_status, last_synced FROM meta_accounts 
       WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [req.user.workspaceId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect a new Meta account
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { account_name, ad_account_id, access_token } = req.body;

    if (!account_name || !ad_account_id || !access_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt token
    const encrypted_token = encrypt(access_token);

    // Store account
    const result = await db.query(
      `INSERT INTO meta_accounts (workspace_id, account_name, ad_account_id, encrypted_access_token, account_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, account_name, ad_account_id`,
      [req.user.workspaceId, account_name, ad_account_id, encrypted_token, 'active']
    );

    const account = result.rows[0];

    // Trigger initial sync (async, don't wait)
    fetchAllAccountMetrics().catch(err => console.error('Sync error:', err));

    res.json({
      success: true,
      account,
      message: 'Account connected. Syncing data in background...'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, account_name, ad_account_id, account_status, last_synced FROM meta_accounts 
       WHERE id = $1 AND workspace_id = $2`,
      [req.params.id, req.user.workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect account
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE meta_accounts SET account_status = 'inactive' WHERE id = $1 AND workspace_id = $2 RETURNING id`,
      [req.params.id, req.user.workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ success: true, message: 'Account disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual sync
router.post('/:id/sync', authMiddleware, async (req, res) => {
  try {
    // Verify account belongs to user
    const accountResult = await db.query(
      `SELECT id FROM meta_accounts WHERE id = $1 AND workspace_id = $2`,
      [req.params.id, req.user.workspaceId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Trigger sync (async)
    fetchAllAccountMetrics().catch(err => console.error('Sync error:', err));

    res.json({ success: true, message: 'Sync triggered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;