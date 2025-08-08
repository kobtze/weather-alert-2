// Shared constants between frontend and backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
export const API_ENDPOINTS = {
  ALERTS: '/api/alerts',
  ALERTS_STATUS: '/api/alerts/status',
  WEATHER: '/api/weather',
  HEALTH: '/health'
};

export const WEATHER_PARAMETERS = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  WIND_SPEED: 'windSpeed',
  PRECIPITATION: 'precipitation'
};

export const OPERATORS = {
  GREATER_THAN: '>',
  LESS_THAN: '<',
  EQUALS: '=',
  GREATER_EQUAL: '>=',
  LESS_EQUAL: '<='
};

