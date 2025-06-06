'use client'

import { useFeatureFlags } from '@/hooks/use-feature-flag'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DebugFeatureFlags() {
  const flags = useFeatureFlags()
  
  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Feature Flags Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span>Trip Sharing:</span>
            <Badge variant={flags.tripSharing ? "success" : "secondary"}>
              {flags.tripSharing ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Group Travel:</span>
            <Badge variant={flags.groupTravel ? "success" : "secondary"}>
              {flags.groupTravel ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>AI Optimization:</span>
            <Badge variant={flags.aiItineraryOptimization ? "success" : "secondary"}>
              {flags.aiItineraryOptimization ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Photo Uploads:</span>
            <Badge variant={flags.photoUploads ? "success" : "secondary"}>
              {flags.photoUploads ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Loading:</span>
            <Badge variant={flags.loading ? "outline" : "secondary"}>
              {flags.loading ? "YES" : "NO"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}