'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TravelPreferencesForm from '@/components/preferences/TravelPreferencesForm'
import PreferencesDebug from '@/components/preferences/PreferencesDebug'
import { useRouter } from 'next/navigation'

export default function TravelPreferencesPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Travel Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Create your personalized travel profile
          </p>
        </div>
      </div>

      <TravelPreferencesForm onComplete={() => router.push('/dashboard/settings')} />
      
      {/* Debug component - remove in production */}
      <div className="mt-6">
        <PreferencesDebug />
      </div>
    </div>
  )
}