const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.TOMORROW_API_KEY;
    this.baseUrl = 'https://api.tomorrow.io/v4/weather';
    
    if (!this.apiKey) {
      console.warn('⚠️  TOMORROW_API_KEY not set. Weather data will not be available.');
    }
  }

  /**
   * Fetch current weather data for a specific location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Weather data object
   */
  async getCurrentWeather(lat, lon) {
    if (!this.apiKey) {
      throw new Error('Tomorrow.io API key not configured');
    }

    try {
      const url = `${this.baseUrl}/realtime`;
      const params = {
        location: `${lat},${lon}`,
        apikey: this.apiKey,
        units: 'metric'
      };

      console.log(`🌤️  Fetching weather data for location: ${lat}, ${lon}`);
      
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.data) {
        const weatherData = response.data.data;
        console.log(`✅ Weather data fetched successfully for ${lat}, ${lon}`);
        
        return {
          temperature: weatherData.values.temperature,
          humidity: weatherData.values.humidity,
          windSpeed: weatherData.values.windSpeed,
          precipitation: weatherData.values.precipitation,
          cloudCover: weatherData.values.cloudCover,
          timestamp: weatherData.time
        };
      } else {
        throw new Error('Invalid response format from Tomorrow.io API');
      }
    } catch (error) {
      console.error(`❌ Error fetching weather data for ${lat}, ${lon}:`, error.message);
      
      if (error.response) {
        // API error response
        throw new Error(`Weather API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to reach weather API');
      } else {
        // Other error
        throw new Error(`Weather service error: ${error.message}`);
      }
    }
  }

  /**
   * Check if the weather service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new WeatherService();
