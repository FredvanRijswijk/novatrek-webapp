/**
 * Weather API client with intelligent caching
 * Minimizes API calls through aggressive caching and forecast data
 */

import { db } from '@/lib/firebase/firestore'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

export interface WeatherData {
  date: Date
  temp: number
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'mist'
  description: string
  icon: string
  windSpeed: number
  humidity: number
  precipitation?: number
}

export interface WeatherCache {
  locationKey: string
  fetchedAt: Timestamp
  forecast: WeatherData[]
  current: WeatherData
}

export class WeatherClient {
  private static instance: WeatherClient
  private apiKey: string
  private cacheHours = 6 // Cache weather data for 6 hours

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
  }

  static getInstance(): WeatherClient {
    if (!WeatherClient.instance) {
      WeatherClient.instance = new WeatherClient()
    }
    return WeatherClient.instance
  }

  /**
   * Get weather for a location with caching
   */
  async getWeather(lat: number, lng: number, date: Date): Promise<WeatherData | null> {
    const locationKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`
    
    // Try cache first
    const cached = await this.getCachedWeather(locationKey)
    if (cached) {
      // Find the weather for the requested date
      const targetDate = date.toISOString().split('T')[0]
      const weather = cached.forecast.find(w => 
        w.date.toISOString().split('T')[0] === targetDate
      )
      if (weather) return weather

      // If date is today, return current weather
      if (targetDate === new Date().toISOString().split('T')[0]) {
        return cached.current
      }
    }

    // Fetch fresh data
    return this.fetchAndCacheWeather(lat, lng, locationKey, date)
  }

  /**
   * Check if activities should be indoor/outdoor based on weather
   */
  static getActivityRecommendation(weather: WeatherData): {
    preferIndoor: boolean
    reason?: string
    severity: 'low' | 'medium' | 'high'
  } {
    // Heavy rain or thunderstorm - definitely indoor
    if (weather.condition === 'thunderstorm' || 
        (weather.condition === 'rain' && weather.precipitation && weather.precipitation > 5)) {
      return {
        preferIndoor: true,
        reason: 'Heavy rain expected',
        severity: 'high'
      }
    }

    // Light rain or drizzle - suggest indoor but not mandatory
    if (weather.condition === 'rain' || weather.condition === 'drizzle') {
      return {
        preferIndoor: true,
        reason: 'Light rain expected',
        severity: 'medium'
      }
    }

    // Snow
    if (weather.condition === 'snow') {
      return {
        preferIndoor: true,
        reason: 'Snow expected',
        severity: 'medium'
      }
    }

    // Extreme temperatures
    if (weather.temp > 35) { // 35°C / 95°F
      return {
        preferIndoor: true,
        reason: 'Very hot weather',
        severity: 'medium'
      }
    }

    if (weather.temp < -5) { // -5°C / 23°F
      return {
        preferIndoor: true,
        reason: 'Very cold weather',
        severity: 'medium'
      }
    }

    // Good weather!
    return {
      preferIndoor: false,
      severity: 'low'
    }
  }

  /**
   * Get cached weather data
   */
  private async getCachedWeather(locationKey: string): Promise<WeatherCache | null> {
    try {
      const cacheDoc = await getDoc(doc(db, 'weatherCache', locationKey))
      if (!cacheDoc.exists()) return null

      const data = cacheDoc.data() as WeatherCache
      const now = new Date()
      const fetchedAt = data.fetchedAt.toDate()
      
      // Check if cache is still valid (6 hours)
      const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceFetch > this.cacheHours) return null

      // Convert dates back to Date objects
      data.forecast = data.forecast.map(w => ({
        ...w,
        date: new Date(w.date)
      }))
      data.current.date = new Date(data.current.date)

      return data
    } catch (error) {
      console.error('Error reading weather cache:', error)
      return null
    }
  }

  /**
   * Fetch weather from API and cache it
   */
  private async fetchAndCacheWeather(
    lat: number, 
    lng: number, 
    locationKey: string,
    requestedDate: Date
  ): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.error('OpenWeather API key not configured')
      return null
    }

    try {
      // Fetch 5-day forecast (includes today)
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Weather API request failed')
      }

      const data = await response.json()
      
      // Process forecast data
      const forecast: WeatherData[] = []
      const dailyMap = new Map<string, any>()

      // Group by day and take the midday forecast
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toISOString().split('T')[0]
        
        // Prefer midday forecast (around 12:00)
        const hour = date.getHours()
        if (!dailyMap.has(dateKey) || Math.abs(hour - 12) < Math.abs(dailyMap.get(dateKey).hour - 12)) {
          dailyMap.set(dateKey, { ...item, hour })
        }
      })

      // Convert to our format
      dailyMap.forEach((item) => {
        forecast.push({
          date: new Date(item.dt * 1000),
          temp: Math.round(item.main.temp),
          condition: this.mapCondition(item.weather[0].main),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          windSpeed: item.wind.speed,
          humidity: item.main.humidity,
          precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0
        })
      })

      // Get current weather
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
      const currentResponse = await fetch(currentUrl)
      const currentData = await currentResponse.json()

      const current: WeatherData = {
        date: new Date(),
        temp: Math.round(currentData.main.temp),
        condition: this.mapCondition(currentData.weather[0].main),
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        windSpeed: currentData.wind.speed,
        humidity: currentData.main.humidity,
        precipitation: currentData.rain?.['1h'] || currentData.snow?.['1h'] || 0
      }

      // Cache the data
      const cacheData: WeatherCache = {
        locationKey,
        fetchedAt: Timestamp.now(),
        forecast,
        current
      }

      await setDoc(doc(db, 'weatherCache', locationKey), cacheData)

      // Return the weather for requested date
      const targetDate = requestedDate.toISOString().split('T')[0]
      const requestedWeather = forecast.find(w => 
        w.date.toISOString().split('T')[0] === targetDate
      )

      return requestedWeather || current
    } catch (error) {
      console.error('Error fetching weather:', error)
      return null
    }
  }

  /**
   * Map OpenWeather conditions to our simplified conditions
   */
  private mapCondition(condition: string): WeatherData['condition'] {
    const conditionMap: { [key: string]: WeatherData['condition'] } = {
      'Clear': 'clear',
      'Clouds': 'clouds',
      'Rain': 'rain',
      'Drizzle': 'drizzle',
      'Thunderstorm': 'thunderstorm',
      'Snow': 'snow',
      'Mist': 'mist',
      'Fog': 'mist',
      'Haze': 'mist'
    }
    return conditionMap[condition] || 'clouds'
  }
}