import { useState, useCallback, useEffect } from 'react'
import { useChat } from 'ai/react'
import { useTravelPreferences } from './use-travel-preferences'
import { getShareablePreferences } from '@/types/preferences'

interface UseVertexAIOptions {
  tripContext?: {
    destination?: { city: string; country: string }
    duration?: number
    startDate?: string
    budget?: string
    travelers?: number
    preferences?: string[]
  }
  useCase?: 'chat' | 'advanced'
  includeUserPreferences?: boolean
}

export function useVertexAI(options: UseVertexAIOptions = {}) {
  const { tripContext, useCase = 'chat', includeUserPreferences = true } = options
  const { preferences } = useTravelPreferences()
  
  // Get shareable preferences
  const userPreferences = includeUserPreferences && preferences 
    ? getShareablePreferences(preferences, false) 
    : undefined
  
  // Use Vercel AI SDK's useChat hook
  const chat = useChat({
    api: '/api/chat',
    body: {
      tripContext,
      userPreferences,
      useCase,
    },
    onError: (error) => {
      console.error('useVertexAI - Chat error:', error)
    },
    onResponse: (response) => {
      console.log('useVertexAI - Got response:', response)
    },
    onFinish: (message) => {
      console.log('useVertexAI - Message finished:', message)
    },
  })

  return chat
}

// Hook for group compromise analysis
export function useGroupCompromise() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const analyzeGroup = useCallback(async (data: {
    groupPreferences: any[]
    destination: string
    duration: number
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/group-compromise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze group preferences')
      }

      const result = await response.json()
      setResult(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analyzeGroup,
    loading,
    error,
    result,
  }
}

// Hook for itinerary optimization
export function useItineraryOptimizer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const optimizeItinerary = useCallback(async (data: {
    activities: any[]
    constraints: any
    destination: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/optimize-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to optimize itinerary')
      }

      const result = await response.json()
      setResult(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    optimizeItinerary,
    loading,
    error,
    result,
  }
}