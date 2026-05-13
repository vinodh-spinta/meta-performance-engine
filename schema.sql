-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  workspace_id INTEGER,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) DEFAULT 'team',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meta Ad Accounts
CREATE TABLE IF NOT EXISTS meta_accounts (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id),
  account_name VARCHAR(255),
  ad_account_id VARCHAR(255) UNIQUE NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  account_status VARCHAR(50) DEFAULT 'active',
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  meta_campaign_id VARCHAR(255),
  campaign_name VARCHAR(255),
  objective VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad Sets
CREATE TABLE IF NOT EXISTS ad_sets (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  meta_ad_set_id VARCHAR(255),
  ad_set_name VARCHAR(255),
  daily_budget DECIMAL(10, 2),
  status VARCHAR(50),
  targeting_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creatives
CREATE TABLE IF NOT EXISTS creatives (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  meta_creative_id VARCHAR(255),
  creative_name VARCHAR(255),
  creative_type VARCHAR(100),
  ad_set_id INTEGER REFERENCES ad_sets(id),
  status VARCHAR(50),
  launched_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily metrics
CREATE TABLE IF NOT EXISTS creative_metrics (
  id SERIAL PRIMARY KEY,
  creative_id INTEGER REFERENCES creatives(id),
  metric_date DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10, 2) DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  ctr DECIMAL(5, 2),
  cpc DECIMAL(10, 2),
  cpa DECIMAL(10, 2),
  roas DECIMAL(5, 2),
  frequency DECIMAL(5, 2),
  video_view_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_id, metric_date)
);

-- User journeys
CREATE TABLE IF NOT EXISTS user_journeys (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  user_id VARCHAR(255),
  journey_path TEXT[],
  touchpoint_timestamps TIMESTAMP[],
  conversion_event VARCHAR(100),
  conversion_value DECIMAL(10, 2),
  conversion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribution
CREATE TABLE IF NOT EXISTS attribution_results (
  id SERIAL PRIMARY KEY,
  creative_id INTEGER REFERENCES creatives(id),
  attribution_model VARCHAR(50),
  credited_conversions DECIMAL(10, 2),
  credited_revenue DECIMAL(10, 2),
  calculation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_id, attribution_model, calculation_date)
);

-- Client settings
CREATE TABLE IF NOT EXISTS client_settings (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  q1_revenue_target DECIMAL(12, 2),
  q2_revenue_target DECIMAL(12, 2),
  q3_revenue_target DECIMAL(12, 2),
  q4_revenue_target DECIMAL(12, 2),
  max_monthly_spend DECIMAL(10, 2),
  min_roas_threshold DECIMAL(5, 2) DEFAULT 2.0,
  max_cpa DECIMAL(10, 2) DEFAULT 50,
  current_inventory INTEGER,
  restock_date DATE,
  restock_lead_time_days INTEGER,
  auto_pause_at_stock INTEGER,
  mode VARCHAR(50) DEFAULT 'scaling',
  auto_mode_switch BOOLEAN DEFAULT TRUE,
  cogs_per_unit DECIMAL(10, 2),
  avg_order_value DECIMAL(10, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  creative_id INTEGER REFERENCES creatives(id),
  recommendation_type VARCHAR(50),
  action_description TEXT,
  reasoning TEXT,
  expected_impact TEXT,
  confidence_score DECIMAL(3, 2),
  current_spend DECIMAL(10, 2),
  recommended_spend DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  execution_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executions
CREATE TABLE IF NOT EXISTS executions (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER REFERENCES recommendations(id),
  action_type VARCHAR(50),
  creative_id INTEGER REFERENCES creatives(id),
  ad_set_id INTEGER REFERENCES ad_sets(id),
  previous_value VARCHAR(255),
  new_value VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  meta_response JSONB,
  error_message TEXT,
  executed_by INTEGER REFERENCES users(id),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern learnings
CREATE TABLE IF NOT EXISTS pattern_learnings (
  id SERIAL PRIMARY KEY,
  meta_account_id INTEGER REFERENCES meta_accounts(id),
  pattern_type VARCHAR(100),
  pattern_description TEXT,
  confidence_score DECIMAL(3, 2),
  supporting_data_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forecasts
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  creative_id INTEGER REFERENCES creatives(id),
  forecast_days_ahead INTEGER,
  predicted_roas DECIMAL(5, 2),
  predicted_conversions INTEGER,
  predicted_spend DECIMAL(10, 2),
  confidence_score DECIMAL(3, 2),
  forecast_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_account_id ON campaigns(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_creative_metrics_date ON creative_metrics(creative_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_user_journeys_account ON user_journeys(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_executions_date ON executions(executed_at);