'use client'

import { useEffect, useState } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { getUserPreferences } from '@/lib/firebase/preferences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PreferencesDebug() {
  const { user } = useFirebase()
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const prefs = await getUserPreferences(user.uid)
      setPreferences(prefs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error loading preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel Preferences Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <strong>User ID:</strong> {user.uid}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          {error && (
            <div className="text-red-500">
              <strong>Error:</strong> {error}
            </div>
          )}
          {preferences && (
            <div>
              <strong>Preferences Found:</strong> Yes
              <div className="mt-2">
                <strong>Travel Styles:</strong>
                <div className="flex gap-1 flex-wrap mt-1">
                  {preferences.travelStyle?.map((style: string) => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <strong>Budget Range:</strong> ${preferences.budgetRange?.min} - ${preferences.budgetRange?.max}
              </div>
              <div className="mt-2">
                <strong>Last Updated:</strong> {preferences.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
              </div>
            </div>
          )}
          {!loading && !error && !preferences && (
            <div>
              <strong>No preferences found</strong>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}