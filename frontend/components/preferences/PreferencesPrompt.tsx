'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTravelPreferences } from '@/hooks/use-travel-preferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, X } from 'lucide-react'

interface PreferencesPromptProps {
  onDismiss?: () => void
  variant?: 'card' | 'banner'
}

export default function PreferencesPrompt({ onDismiss, variant = 'card' }: PreferencesPromptProps) {
  const router = useRouter()
  const { hasPreferences, loading } = useTravelPreferences()
  const [dismissed, setDismissed] = useState(false)

  // Check if user has dismissed this prompt before
  useEffect(() => {
    const isDismissed = localStorage.getItem('preferences-prompt-dismissed')
    if (isDismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('preferences-prompt-dismissed', 'true')
    if (onDismiss) onDismiss()
  }

  const handleSetup = () => {
    router.push('/dashboard/settings/travel-preferences')
  }

  // Don't show if loading, has preferences, or dismissed
  if (loading || hasPreferences || dismissed) {
    return null
  }

  if (variant === 'banner') {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">Personalize your travel experience</p>
            <p className="text-sm text-muted-foreground">
              Set up your travel preferences for better recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSetup}>
            Set Up Now
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="relative">
      <Badge className="absolute -top-2 -right-2 bg-primary">New</Badge>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Personalize Your Travel Experience
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Get AI-powered recommendations tailored to your travel style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">Set up your travel profile to:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Get personalized destination recommendations</li>
            <li>• Receive activity suggestions based on your interests</li>
            <li>• Find accommodations that match your style and budget</li>
            <li>• Make group travel planning easier with shared preferences</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSetup} className="flex-1">
            Set Up Travel Preferences
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}