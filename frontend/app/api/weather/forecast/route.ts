import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { WeatherServerClient } from '@/lib/weather/server-client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('firebaseIdToken')
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { location, date } = await request.json()

    if (!location || !location.lat || !location.lng) {
      return NextResponse.json(
        { error: 'Location coordinates required' },
        { status: 400 }
      )
    }

    // Get weather data
    const weatherClient = WeatherServerClient.getInstance()
    const weatherData = await weatherClient.getWeather(
      location.lat,
      location.lng,
      new Date(date)
    )

    if (!weatherData) {
      return NextResponse.json({ weather: null })
    }

    return NextResponse.json({
      weather: {
        temp: weatherData.temp,
        condition: weatherData.condition,
        description: weatherData.description,
        icon: weatherData.icon
      }
    })

  } catch (error) {
    console.error('Weather forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    )
  }
}