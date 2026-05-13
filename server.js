require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// Database setup
const db = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/creatives', require('./routes/creatives'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// Background jobs
// Fetch metrics every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled metric fetch...');
  const { fetchAllAccountMetrics } = require('./services/metaService');
  await fetchAllAccountMetrics();
});

// Analyze patterns and generate recommendations daily
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily pattern analysis and recommendations...');
  const { analyzePatterns } = require('./services/analysisService');
  await analyzePatterns();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Meta Performance Engine running on port ${PORT}`);
});

module.exports = app;