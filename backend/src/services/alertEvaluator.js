const axios = require('axios');
const weatherService = require('./weather');

class AlertEvaluator {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Evaluate all active alerts against current weather conditions
   */
  async evaluateAllAlerts() {
    try {
      console.log('🔍 Starting alert evaluation...');
      
      // Step 1: Fetch all alerts via API
      const alerts = await this.fetchAllAlerts();
      
      if (alerts.length === 0) {
        console.log('📭 No alerts found to evaluate');
        return;
      }

      console.log(`📋 Found ${alerts.length} alert(s) to evaluate`);

      // Step 2: Evaluate each alert
      const evaluationResults = [];
      
      for (const alert of alerts) {
        try {
          const result = await this.evaluateSingleAlert(alert);
          evaluationResults.push(result);
        } catch (error) {
          console.error(`❌ Error evaluating alert ${alert.id}:`, error.message);
          evaluationResults.push({
            alertId: alert.id,
            success: false,
            error: error.message
          });
        }
      }

      // Step 3: Update alert statuses via API
      await this.updateAlertStatuses(evaluationResults);

      console.log('✅ Alert evaluation completed');
      return evaluationResults;

    } catch (error) {
      console.error('❌ Error in alert evaluation process:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all alerts from the API
   */
  async fetchAllAlerts() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/alerts`);
      return response.data.alerts || [];
    } catch (error) {
      console.error('❌ Error fetching alerts:', error.message);
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  }

  /**
   * Evaluate a single alert against current weather
   */
  async evaluateSingleAlert(alert) {
    try {
      // Get current weather for the alert location
      const weather = await weatherService.getCurrentWeather(alert.lat, alert.lon);
      
      // Get the weather parameter value
      const currentValue = weather[alert.parameter];
      
      if (currentValue === undefined) {
        throw new Error(`Weather parameter '${alert.parameter}' not available`);
      }

      // Evaluate the condition
      const isTriggered = this.evaluateCondition(
        currentValue,
        alert.operator,
        alert.threshold
      );

      console.log(`📍 Alert ${alert.id}: ${alert.parameter} = ${currentValue} ${alert.operator} ${alert.threshold} → ${isTriggered ? 'TRIGGERED' : 'Not triggered'}`);

      return {
        alertId: alert.id,
        success: true,
        isTriggered,
        currentValue,
        weatherData: weather,
        evaluatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error evaluating alert ${alert.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Evaluate a condition using the given operator
   */
  evaluateCondition(currentValue, operator, threshold) {
    switch (operator) {
      case '>':
        return currentValue > threshold;
      case '<':
        return currentValue < threshold;
      case '>=':
        return currentValue >= threshold;
      case '<=':
        return currentValue <= threshold;
      case '=':
        return currentValue === threshold;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Update alert statuses via API calls
   */
  async updateAlertStatuses(evaluationResults) {
    const updatePromises = evaluationResults
      .filter(result => result.success)
      .map(result => this.updateAlertStatus(result.alertId, result.isTriggered));

    try {
      await Promise.all(updatePromises);
      console.log(`✅ Updated ${updatePromises.length} alert status(es)`);
    } catch (error) {
      console.error('❌ Error updating alert statuses:', error.message);
      throw error;
    }
  }

  /**
   * Update a single alert status via API
   */
  async updateAlertStatus(alertId, isTriggered) {
    try {
      const response = await axios.put(`${this.baseUrl}/api/alerts/${alertId}/status`, {
        is_triggered: isTriggered,
        checked_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating alert ${alertId} status:`, error.message);
      throw error;
    }
  }
}

module.exports = new AlertEvaluator();
