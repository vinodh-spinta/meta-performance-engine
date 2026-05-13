const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, workspace_name } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create workspace
    const workspaceResult = await db.query(
      `INSERT INTO workspaces (name, type) VALUES ($1, $2) RETURNING id`,
      [workspace_name || email, 'team']
    );

    const workspaceId = workspaceResult.rows[0].id;

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, full_name, workspace_id, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name`,
      [email, hashedPassword, full_name || '', workspaceId, 'admin']
    );

    const user = userResult.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, workspaceId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await db.query(
      `SELECT id, email, password_hash, full_name, workspace_id FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, workspaceId: user.workspace_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Verify token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;