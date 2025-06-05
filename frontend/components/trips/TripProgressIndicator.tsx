'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, AlertCircle, TrendingUp } from 'lucide-react'
import { Trip } from '@/types/travel'
import { analyzeTripProgress, type TripAnalysis } from '@/lib/ai/trip-context-analyzer'

interface TripProgressIndicatorProps {
  trip: Trip
  onSuggestionClick?: (suggestion: string) => void
}

export function TripProgressIndicator({ trip, onSuggestionClick }: TripProgressIndicatorProps) {
  const [analysis, setAnalysis] = useState<TripAnalysis | null>(null)

  useEffect(() => {
    const result = analyzeTripProgress(trip)
    setAnalysis(result)
  }, [trip])

  if (!analysis) return null

  const getStageColor = (stage: TripAnalysis['stage']) => {
    switch (stage) {
      case 'initial': return 'text-yellow-600'
      case 'partial': return 'text-blue-600'
      case 'detailed': return 'text-purple-600'
      case 'complete': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStageBadgeVariant = (stage: TripAnalysis['stage']) => {
    switch (stage) {
      case 'initial': return 'secondary'
      case 'partial': return 'default'
      case 'detailed': return 'default'
      case 'complete': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Trip Planning Progress</CardTitle>
            <CardDescription>
              Your trip is {analysis.completionPercentage}% planned
            </CardDescription>
          </div>
          <Badge variant={getStageBadgeVariant(analysis.stage)} className={getStageColor(analysis.stage)}>
            {analysis.stage.charAt(0).toUpperCase() + analysis.stage.slice(1)} Planning
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={analysis.completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Getting Started</span>
            <span>Ready to Go!</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Days Planned</p>
            <p className="text-2xl font-bold">
              {analysis.stats.daysPlanned}/{analysis.stats.totalDays}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Activities</p>
            <p className="text-2xl font-bold">{analysis.stats.activitiesCount}</p>
          </div>
        </div>

        {/* Missing Elements */}
        {analysis.missingElements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">To Complete Your Planning:</p>
            <ul className="space-y-1">
              {analysis.missingElements.map((element, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{element}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Smart Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              AI Suggestions
            </p>
            <div className="space-y-2">
              {analysis.suggestions.slice(0, 2).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="w-full text-left p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {analysis.nextSteps.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Next Steps:</p>
            <ul className="space-y-1">
              {analysis.nextSteps.map((step, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}