# Weather-Aware Activity System

## Overview

NovaTrek now features a smart weather-aware activity recommendation system that:
- Shows real-time weather for trip dates
- Automatically suggests indoor activities when weather is bad
- Caches weather data to minimize API costs
- Uses OpenWeatherMap's free tier (1,000 calls/day)

## How It Works

### 1. **Weather Fetching**
- When users search for activities, we fetch weather for that date/location
- Weather data is cached in Firestore for 6 hours
- Subsequent searches use cached data (no API call)

### 2. **Smart Recommendations**
The system analyzes weather conditions and recommends:
- **Heavy rain/thunderstorm** → Strong indoor preference
- **Light rain/drizzle** → Moderate indoor preference  
- **Extreme temps (>35°C or <-5°C)** → Indoor suggested
- **Good weather** → Mix of indoor/outdoor activities

### 3. **User Control**
- Toggle "Prefer indoor activities" to manually filter
- Weather alerts show current conditions
- Activities are sorted with indoor options first when needed

## Cost Optimization

### **API Usage**
- **Free tier**: 1,000 calls/day from OpenWeatherMap
- **Caching**: Each location cached for 6 hours
- **Forecast API**: One call gets 5 days of weather

### **Cost Calculation**
With caching, 1,000 daily calls supports:
- ~6,000 unique location/day searches
- ~180,000 searches/month
- Effectively **$0 cost** for most use cases

### **Scaling Strategy**
If you exceed free tier:
1. Increase cache duration to 12-24 hours
2. Use city-level caching (not precise coordinates)
3. OpenWeatherMap paid tier: $0.0012/call after free tier

## Setup Instructions

### 1. **Get OpenWeatherMap API Key**
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your-api-key-here
   ```

### 2. **Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

### 3. **Test the Feature**
1. Create a trip to any destination
2. Go to day planning
3. Click "Add Activity"
4. Search for activities - weather will appear automatically

## Future Enhancements

1. **Multi-day weather view** - Show weather for entire trip duration
2. **Weather-based itinerary optimization** - Rearrange activities based on forecast
3. **Seasonal recommendations** - Suggest activities based on time of year
4. **Weather notifications** - Alert users to weather changes for their trip

## Technical Details

### Weather Client (`lib/weather/client.ts`)
- Singleton pattern for efficient instance management
- Aggressive caching with Firestore
- Automatic fallback for missing data
- Type-safe weather conditions

### Activity Search Enhancement
- Indoor/outdoor activity classification
- Weather-based sorting algorithm
- Real-time preference toggling
- Smart activity filtering

### UI Components
- Weather alerts with condition icons
- Indoor preference toggle
- Temperature display in Celsius
- Responsive weather cards