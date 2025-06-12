import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';

const weatherFilterParams = z.object({
  date: z.string(),
  activities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    indoorOutdoor: z.enum(['indoor', 'outdoor', 'both']).optional()
  })).optional(),
  searchType: z.enum(['activity', 'restaurant']).optional(),
  preferences: z.object({
    avoidRain: z.boolean().default(true),
    temperatureRange: z.object({
      min: z.number().default(10),
      max: z.number().default(30)
    }).optional(),
    preferIndoorIfBadWeather: z.boolean().default(true)
  }).optional()
});

interface WeatherConditions {
  date: string;
  temperature: {
    high: number;
    low: number;
    current?: number;
  };
  conditions: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
  precipitation: number; // percentage
  windSpeed: number;
  humidity: number;
  hourlyForecast?: Array<{
    hour: string;
    temp: number;
    conditions: string;
    precipChance: number;
  }>;
}

interface FilteredActivity {
  activity: any;
  weatherScore: number;
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
  alternatives?: any[];
  bestTime?: string;
}

interface WeatherFilterResult {
  weather: WeatherConditions;
  filteredActivities: FilteredActivity[];
  recommendations: {
    bestTimeOfDay: string;
    indoorAlternatives: any[];
    weatherTips: string[];
  };
  summary: string;
}

export const weatherFilterTool: TravelTool<z.infer<typeof weatherFilterParams>, WeatherFilterResult> = {
  id: 'weather_filter',
  name: 'Weather-Aware Activity Filter',
  description: 'Filter and rank activities based on weather conditions, suggesting alternatives and optimal times',
  category: 'planning',
  parameters: weatherFilterParams,
  
  async execute(params, context) {
    try {
      const { date, activities = [], searchType, preferences = {} } = params;
      
      // Get weather data (mock for now, would integrate with weather API)
      const weather = await getWeatherForDate(date, context);
      
      // If no activities provided, get them from the trip day
      let activitiesToFilter = activities;
      if (activitiesToFilter.length === 0) {
        const tripDay = context.tripDays.find(day => {
          // Handle ISO date strings by extracting just the date part
          const dayDate = day.date.includes('T') ? day.date.split('T')[0] : day.date;
          return dayDate === date;
        });
        if (tripDay?.activities) {
          activitiesToFilter = tripDay.activities;
        }
      }
      
      // Filter and score activities based on weather
      const filteredActivities = activitiesToFilter.map(activity => 
        evaluateActivityForWeather(activity, weather, preferences)
      );
      
      // Sort by weather suitability
      filteredActivities.sort((a, b) => b.weatherScore - a.weatherScore);
      
      // Find indoor alternatives if needed
      const indoorAlternatives = await findIndoorAlternatives(
        filteredActivities.filter(f => f.suitability === 'poor'),
        context
      );
      
      // Generate recommendations
      const recommendations = generateWeatherRecommendations(
        weather,
        filteredActivities,
        indoorAlternatives,
        preferences
      );
      
      // Create summary
      const summary = generateWeatherSummary(weather, filteredActivities);
      
      return {
        success: true,
        data: {
          weather,
          filteredActivities,
          recommendations,
          summary
        },
        metadata: {
          algorithm: 'weather-aware-filtering',
          dataSource: 'mock-weather-api', // Would be actual API
          lastUpdated: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Weather filter error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Weather filtering failed'
      };
    }
  }
};

function evaluateActivityForWeather(
  activity: any,
  weather: WeatherConditions,
  preferences: any
): FilteredActivity {
  let weatherScore = 100;
  const warnings: string[] = [];
  let suitability: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  
  // Determine if activity is indoor/outdoor
  const isOutdoor = determineIfOutdoor(activity);
  const isIndoor = determineIfIndoor(activity);
  
  // Rain impact
  if (weather.conditions === 'rain' || weather.precipitation > 50) {
    if (isOutdoor && !isIndoor) {
      weatherScore -= 60;
      warnings.push('Activity may be affected by rain');
      suitability = 'poor';
    } else if (isOutdoor && isIndoor) {
      weatherScore -= 20;
      warnings.push('Outdoor portions may be affected by rain');
      suitability = 'fair';
    }
  }
  
  // Temperature impact
  const avgTemp = (weather.temperature.high + weather.temperature.low) / 2;
  if (isOutdoor) {
    if (avgTemp < preferences.temperatureRange?.min || 10) {
      weatherScore -= 30;
      warnings.push(`Cold temperature: ${avgTemp}°C`);
      suitability = suitability === 'excellent' ? 'good' : 'fair';
    } else if (avgTemp > preferences.temperatureRange?.max || 30) {
      weatherScore -= 30;
      warnings.push(`Hot temperature: ${avgTemp}°C`);
      suitability = suitability === 'excellent' ? 'good' : 'fair';
    }
  }
  
  // Wind impact for outdoor activities
  if (isOutdoor && weather.windSpeed > 30) {
    weatherScore -= 20;
    warnings.push('High winds expected');
    suitability = suitability === 'excellent' ? 'good' : suitability;
  }
  
  // Storm warning
  if (weather.conditions === 'storm') {
    if (isOutdoor) {
      weatherScore -= 80;
      warnings.push('Storm warning - avoid outdoor activities');
      suitability = 'poor';
    } else {
      weatherScore -= 20;
      warnings.push('Storm may affect transportation');
    }
  }
  
  // Find best time of day if hourly forecast available
  let bestTime;
  if (weather.hourlyForecast && isOutdoor) {
    bestTime = findBestTimeForActivity(activity, weather.hourlyForecast);
  }
  
  // Determine final suitability based on score
  if (weatherScore >= 80) suitability = 'excellent';
  else if (weatherScore >= 60) suitability = 'good';
  else if (weatherScore >= 40) suitability = 'fair';
  else suitability = 'poor';
  
  return {
    activity,
    weatherScore,
    suitability,
    warnings,
    bestTime
  };
}

function determineIfOutdoor(activity: any): boolean {
  if (activity.indoorOutdoor === 'outdoor') return true;
  
  const outdoorKeywords = [
    'park', 'beach', 'hike', 'trail', 'garden', 'zoo', 
    'outdoor', 'walking tour', 'bike', 'boat', 'ferry'
  ];
  
  const activityText = `${activity.name} ${activity.type} ${activity.description || ''}`.toLowerCase();
  return outdoorKeywords.some(keyword => activityText.includes(keyword));
}

function determineIfIndoor(activity: any): boolean {
  if (activity.indoorOutdoor === 'indoor') return true;
  
  const indoorKeywords = [
    'museum', 'gallery', 'restaurant', 'cafe', 'shop', 'mall',
    'theater', 'cinema', 'indoor', 'spa', 'gym'
  ];
  
  const activityText = `${activity.name} ${activity.type} ${activity.description || ''}`.toLowerCase();
  return indoorKeywords.some(keyword => activityText.includes(keyword));
}

async function getWeatherForDate(date: string, context: ToolContext): Promise<WeatherConditions> {
  // Mock weather data - in real implementation would call weather API
  const conditions = ['clear', 'cloudy', 'rain', 'snow', 'storm'] as const;
  const randomCondition = conditions[Math.floor(Math.random() * 3)]; // Biased towards better weather
  
  const baseTemp = 20;
  const variation = Math.floor(Math.random() * 10) - 5;
  
  return {
    date,
    temperature: {
      high: baseTemp + variation + 5,
      low: baseTemp + variation - 5,
      current: baseTemp + variation
    },
    conditions: randomCondition,
    precipitation: randomCondition === 'rain' ? 70 : randomCondition === 'cloudy' ? 30 : 10,
    windSpeed: Math.floor(Math.random() * 40),
    humidity: 50 + Math.floor(Math.random() * 30),
    hourlyForecast: generateHourlyForecast(randomCondition, baseTemp + variation)
  };
}

function generateHourlyForecast(baseCondition: string, baseTemp: number): any[] {
  const forecast = [];
  for (let hour = 6; hour <= 22; hour++) {
    const tempVariation = Math.sin((hour - 6) * Math.PI / 16) * 5;
    forecast.push({
      hour: `${hour}:00`,
      temp: Math.round(baseTemp + tempVariation),
      conditions: hour >= 14 && hour <= 16 && baseCondition === 'rain' ? 'rain' : 'clear',
      precipChance: hour >= 14 && hour <= 16 && baseCondition === 'rain' ? 80 : 10
    });
  }
  return forecast;
}

function findBestTimeForActivity(activity: any, hourlyForecast: any[]): string | undefined {
  // Find hours with best weather
  const goodHours = hourlyForecast.filter(h => 
    h.conditions !== 'rain' && 
    h.temp >= 15 && 
    h.temp <= 28 &&
    h.precipChance < 30
  );
  
  if (goodHours.length === 0) return undefined;
  
  // Prefer mid-morning or late afternoon
  const preferredHours = goodHours.filter(h => {
    const hour = parseInt(h.hour.split(':')[0]);
    return (hour >= 9 && hour <= 11) || (hour >= 16 && hour <= 18);
  });
  
  return (preferredHours[0] || goodHours[0]).hour;
}

async function findIndoorAlternatives(
  poorWeatherActivities: FilteredActivity[],
  context: ToolContext
): Promise<any[]> {
  // Mock indoor alternatives - in real implementation would search for nearby indoor activities
  const indoorTypes = ['museum', 'gallery', 'shopping', 'spa', 'restaurant', 'cafe'];
  
  return poorWeatherActivities.map(filtered => ({
    originalActivity: filtered.activity.name,
    alternatives: [
      {
        name: `Indoor Alternative: ${indoorTypes[Math.floor(Math.random() * indoorTypes.length)]}`,
        type: 'indoor_activity',
        weatherScore: 95,
        distance: '0.5 km'
      }
    ]
  }));
}

function generateWeatherRecommendations(
  weather: WeatherConditions,
  filteredActivities: FilteredActivity[],
  indoorAlternatives: any[],
  preferences: any
): any {
  const tips: string[] = [];
  
  // Temperature tips
  if (weather.temperature.high > 28) {
    tips.push('Stay hydrated and wear sun protection');
    tips.push('Consider activities during cooler morning or evening hours');
  } else if (weather.temperature.low < 15) {
    tips.push('Dress in layers for changing temperatures');
    tips.push('Bring a warm jacket for evening activities');
  }
  
  // Rain tips
  if (weather.conditions === 'rain' || weather.precipitation > 50) {
    tips.push('Bring an umbrella or rain jacket');
    tips.push('Consider rescheduling outdoor activities or choosing indoor alternatives');
    tips.push('Book restaurants in advance as they may be busier');
  }
  
  // Find best time of day
  let bestTimeOfDay = 'morning';
  if (weather.hourlyForecast) {
    const avgMorning = weather.hourlyForecast.slice(0, 6).reduce((sum, h) => sum + h.precipChance, 0) / 6;
    const avgAfternoon = weather.hourlyForecast.slice(6, 11).reduce((sum, h) => sum + h.precipChance, 0) / 5;
    const avgEvening = weather.hourlyForecast.slice(11).reduce((sum, h) => sum + h.precipChance, 0) / 6;
    
    if (avgMorning <= avgAfternoon && avgMorning <= avgEvening) {
      bestTimeOfDay = 'morning (9am-12pm)';
    } else if (avgAfternoon <= avgEvening) {
      bestTimeOfDay = 'afternoon (12pm-5pm)';
    } else {
      bestTimeOfDay = 'evening (5pm-10pm)';
    }
  }
  
  return {
    bestTimeOfDay,
    indoorAlternatives,
    weatherTips: tips
  };
}

function generateWeatherSummary(
  weather: WeatherConditions,
  filteredActivities: FilteredActivity[]
): string {
  const excellentCount = filteredActivities.filter(f => f.suitability === 'excellent').length;
  const poorCount = filteredActivities.filter(f => f.suitability === 'poor').length;
  
  let summary = `Weather forecast for ${weather.date}: ${weather.conditions} with temperatures between ${weather.temperature.low}°C and ${weather.temperature.high}°C. `;
  
  if (weather.conditions === 'clear' && excellentCount === filteredActivities.length) {
    summary += 'Perfect weather for all planned activities!';
  } else if (weather.conditions === 'rain' && poorCount > 0) {
    summary += `${poorCount} outdoor activities may be affected by rain. Consider indoor alternatives or rescheduling.`;
  } else {
    summary += `${excellentCount} activities have excellent weather conditions, ${poorCount} may need adjustments.`;
  }
  
  return summary;
}