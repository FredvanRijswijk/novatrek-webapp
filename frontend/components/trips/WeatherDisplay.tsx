'use client'

import { useEffect, useState } from 'react'
import { CloudRain, Sun, Cloud, Umbrella, Snowflake, CloudDrizzle, CloudLightning, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WeatherDisplayProps {
  date: Date
  location?: { lat: number; lng: number }
  className?: string
  showDetails?: boolean
}

interface WeatherData {
  temp: number
  condition: string
  description: string
  icon: string
}

export function WeatherDisplay({ date, location, className, showDetails = false }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return
      
      setLoading(true)
      try {
        // Get auth token
        const auth = await import('firebase/auth')
        const currentUser = auth.getAuth().currentUser
        const token = currentUser ? await currentUser.getIdToken() : null

        const response = await fetch('/api/weather/forecast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            location,
            date: date.toISOString()
          })
        })

        if (response.ok) {
          const data = await response.json()
          setWeather(data.weather)
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [date, location])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'rain':
        return <CloudRain className="h-4 w-4" />
      case 'drizzle':
        return <CloudDrizzle className="h-4 w-4" />
      case 'thunderstorm':
        return <CloudLightning className="h-4 w-4" />
      case 'snow':
        return <Snowflake className="h-4 w-4" />
      case 'clear':
        return <Sun className="h-4 w-4" />
      default:
        return <Cloud className="h-4 w-4" />
    }
  }

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'snow':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'clear':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
      </Badge>
    )
  }

  if (!weather) return null

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-normal",
        getWeatherColor(weather.condition),
        className
      )}
    >
      {getWeatherIcon(weather.condition)}
      <span className="font-medium">{weather.temp}°C</span>
      {showDetails && (
        <span className="text-xs capitalize">{weather.description}</span>
      )}
    </Badge>
  )
}