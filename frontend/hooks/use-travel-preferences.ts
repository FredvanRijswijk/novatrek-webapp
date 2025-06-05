import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { 
  getUserPreferences, 
  saveUserPreferences, 
  hasUserSetupPreferences,
  markPreferencesAsUsed 
} from '@/lib/firebase/preferences'
import { TravelPreferences } from '@/types/preferences'

export function useTravelPreferences() {
  const { user } = useFirebase()
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPreferences, setHasPreferences] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences()
    } else {
      setPreferences(null)
      setHasPreferences(false)
      setLoading(false)
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    setLoading(true)
    try {
      const prefs = await getUserPreferences(user.uid)
      setPreferences(prefs)
      
      const hasSetup = await hasUserSetupPreferences(user.uid)
      setHasPreferences(hasSetup)
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<TravelPreferences>) => {
    if (!user) return

    setSaving(true)
    try {
      await saveUserPreferences(user.uid, updates)
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null)
      
      // Check if user has now set up preferences
      const hasSetup = await hasUserSetupPreferences(user.uid)
      setHasPreferences(hasSetup)
      
      return true
    } catch (error) {
      console.error('Error saving preferences:', error)
      return false
    } finally {
      setSaving(false)
    }
  }

  const markAsUsed = async () => {
    if (!user) return
    
    try {
      await markPreferencesAsUsed(user.uid)
    } catch (error) {
      console.error('Error marking preferences as used:', error)
    }
  }

  return {
    preferences,
    loading,
    saving,
    hasPreferences,
    updatePreferences,
    markAsUsed,
    reload: loadPreferences,
  }
}