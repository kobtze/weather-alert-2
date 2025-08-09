# Weather Alert System

## Prerequisites
- Node.js (version 16 or higher)
- MySQL (version 8.0 or higher)
- **Sign up to Tomorrow.io API to get API key**: Visit [Tomorrow.io](https://www.tomorrow.io) and create an account to obtain your API key

## Quick Setup
```bash
# Install dependencies
npm install

# Copy environment file and configure
cp backend/env.example backend/.env
# Edit .env with your MySQL credentials and Tomorrow.io API key

# Create MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS weather_alerts;"

# Start the application
npm start
```

## Key Features
- Create weather alerts for specific locations and conditions
- Automatic alert evaluation every 5 minutes
- React frontend with 3 tabs: Home, Alerts, Current State
- REST API for alert management

## API Endpoints
- `GET /` - Hello World endpoint
- `GET /health` - Health check endpoint (includes database status)
- `POST /api/alerts` - Create weather alert (max 3 alerts)
- `GET /api/alerts` - List all alerts with their current status
- `DELETE /api/alerts/:id` - Delete an alert
- `GET /api/alerts/status` - List only triggered alerts
- `PUT /api/alerts/:id/status` - Update alert status
- `POST /api/alerts/evaluate` - Manually trigger alert evaluation
- `GET /api/weather` - Fetch weather data for a location

## Architecture
```
React App → NodeJS API → MySQL
                ↓
        Tomorrow.io Weather API
```