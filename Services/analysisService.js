const db = require('../config/database');

// Analyze creative fatigue and performance patterns
const analyzeCreativePerformance = async (creativeId) => {
  try {
    // Get 30 days of historical data
    const metricsResult = await db.query(
      `SELECT * FROM creative_metrics 
       WHERE creative_id = $1 AND metric_date >= NOW()::date - INTERVAL '30 days'
       ORDER BY metric_date`,
      [creativeId]
    );

    const metrics = metricsResult.rows;
    if (metrics.length < 3) return null; // Not enough data

    // Calculate trends
    const roasValues = metrics.map(m => parseFloat(m.roas) || 0);
    const ctrValues = metrics.map(m => parseFloat(m.ctr) || 0);
    const cpaValues = metrics.map(m => parseFloat(m.cpa) || 0);
    const frequencyValues = metrics.map(m => parseFloat(m.frequency) || 0);

    // Detect declining trend
    const avgROAS = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
    const latestROAS = roasValues[roasValues.length - 1];
    const roasDecline = ((avgROAS - latestROAS) / avgROAS * 100).toFixed(2);

    const avgCTR = ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length;
    const latestCTR = ctrValues[ctrValues.length - 1];
    const ctrDecline = ((avgCTR - latestCTR) / avgCTR * 100).toFixed(2);

    // Detect saturation (high frequency)
    const avgFrequency = frequencyValues.reduce((a, b) => a + b, 0) / frequencyValues.length;
    const isSaturated = avgFrequency > 11;

    // Detect creative age
    const creativeResult = await db.query(
      `SELECT launched_date FROM creatives WHERE id = $1`,
      [creativeId]
    );
    const launchedDate = new Date(creativeResult.rows[0].launched_date);
    const ageInDays = Math.floor((Date.now() - launchedDate) / (1000 * 60 * 60 * 24));

    // Determine if fatiguing
    const fatigueScore = calculateFatigueScore({
      roasDecline: parseFloat(roasDecline),
      ctrDecline: parseFloat(ctrDecline),
      isSaturated,
      ageInDays,
      latestROAS
    });

    return {
      creativeId,
      ageInDays,
      currentROAS: latestROAS,
      avgROAS,
      roasDecline: parseFloat(roasDecline),
      ctrDecline: parseFloat(ctrDecline),
      frequency: avgFrequency,
      isSaturated,
      fatigueScore,
      recommendation: generateFatigueRecommendation(fatigueScore, latestROAS, ageInDays)
    };
  } catch (error) {
    console.error('Error analyzing creative performance:', error.message);
    return null;
  }
};

// Calculate fatigue score (0-100)
const calculateFatigueScore = ({ roasDecline, ctrDecline, isSaturated, ageInDays, latestROAS }) => {
  let score = 0;

  // ROAS decline (up to 40 points)
  if (roasDecline > 30) score += 40;
  else if (roasDecline > 20) score += 30;
  else if (roasDecline > 10) score += 20;
  else if (roasDecline > 5) score += 10;

  // CTR decline (up to 30 points)
  if (ctrDecline > 30) score += 30;
  else if (ctrDecline > 20) score += 20;
  else if (ctrDecline > 10) score += 10;

  // Saturation (up to 20 points)
  if (isSaturated) score += 20;

  // Age factor (up to 20 points)
  if (ageInDays > 35) score += 20;
  else if (ageInDays > 28) score += 15;
  else if (ageInDays > 21) score += 10;

  // ROAS viability (can reduce score if still profitable)
  if (latestROAS < 1.5) score += 10;
  else if (latestROAS < 2.0) score -= 5;

  return Math.min(100, Math.max(0, score));
};

// Generate recommendation based on fatigue score
const generateFatigueRecommendation = (fatigueScore, latestROAS, ageInDays) => {
  if (fatigueScore >= 70 || latestROAS < 1.2) {
    return {
      action: 'PAUSE',
      urgency: 'HIGH',
      reason: 'Creative showing severe fatigue or non-profitability'
    };
  } else if (fatigueScore >= 50 || latestROAS < 1.5 && ageInDays > 21) {
    return {
      action: 'REDUCE',
      urgency: 'MEDIUM',
      reason: 'Creative declining, recommend budget reduction'
    };
  } else if (fatigueScore >= 35 || (ageInDays > 20 && ageInDays < 25)) {
    return {
      action: 'REFRESH',
      urgency: 'MEDIUM',
      reason: 'Creative showing early fatigue signs, refresh recommended'
    };
  } else {
    return {
      action: 'MAINTAIN',
      urgency: 'LOW',
      reason: 'Creative performing well'
    };
  }
};

// Analyze all creatives and generate recommendations
const analyzePatterns = async () => {
  try {
    // Get all active creatives
    const creativesResult = await db.query(
      `SELECT id FROM creatives WHERE status = 'ACTIVE'`
    );

    for (const creative of creativesResult.rows) {
      const analysis = await analyzeCreativePerformance(creative.id);
      
      if (analysis && analysis.fatigueScore > 35) {
        // Generate recommendation
        await generateRecommendation(
          creative.id,
          analysis.recommendation.action,
          analysis
        );
      }
    }

    console.log('✅ Pattern analysis complete');
  } catch (error) {
    console.error('Error in analyzePatterns:', error.message);
  }
};

// Generate and store a recommendation
const generateRecommendation = async (creativeId, actionType, analysis) => {
  try {
    // Get creative and current spend
    const creativeResult = await db.query(
      `SELECT c.id, c.creative_name, a.id as ad_set_id
       FROM creatives c
       JOIN ad_sets a ON c.ad_set_id = a.id
       WHERE c.id = $1`,
      [creativeId]
    );

    if (creativeResult.rows.length === 0) return;

    // Get current spend
    const metricsResult = await db.query(
      `SELECT spend FROM creative_metrics WHERE creative_id = $1 ORDER BY metric_date DESC LIMIT 1`,
      [creativeId]
    );

    const currentSpend = metricsResult.rows.length > 0 ? metricsResult.rows[0].spend : 0;

    let recommendedSpend = currentSpend;
    let description = '';
    let expectedImpact = '';

    switch (actionType) {
      case 'PAUSE':
        recommendedSpend = 0;
        description = `Pause ${creativeResult.rows[0].creative_name} due to fatigue (ROAS ${analysis.currentROAS}x)`;
        expectedImpact = `Save $${currentSpend.toFixed(2)}/month`;
        break;
      case 'REDUCE':
        recommendedSpend = currentSpend * 0.5;
        description = `Reduce ${creativeResult.rows[0].creative_name} budget by 50% (declining ROAS)`;
        expectedImpact = `Save $${(currentSpend * 0.5).toFixed(2)}/month`;
        break;
      case 'REFRESH':
        description = `Refresh ${creativeResult.rows[0].creative_name} - showing early fatigue signs`;
        expectedImpact = `Extend creative life by 2-3 weeks if refreshed`;
        break;
      default:
        return;
    }

    // Check if recommendation already exists and pending
    const existingResult = await db.query(
      `SELECT id FROM recommendations 
       WHERE creative_id = $1 AND status = 'pending' AND recommendation_type = $2`,
      [creativeId, actionType]
    );

    if (existingResult.rows.length === 0) {
      // Create new recommendation
      await db.query(
        `INSERT INTO recommendations 
         (creative_id, recommendation_type, action_description, reasoning, expected_impact, confidence_score, current_spend, recommended_spend)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [creativeId, actionType, description, `Fatigue score: ${analysis.fatigueScore}`, expectedImpact, (analysis.fatigueScore / 100).toFixed(2), currentSpend, recommendedSpend]
      );
    }
  } catch (error) {
    console.error('Error generating recommendation:', error.message);
  }
};

module.exports = {
  analyzeCreativePerformance,
  analyzePatterns,
  generateRecommendation,
  calculateFatigueScore
};