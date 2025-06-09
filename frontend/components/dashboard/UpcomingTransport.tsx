'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Ship,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import { TravelSegmentModel } from '@/lib/models/travel-segment'
import { useFirebase } from '@/lib/firebase/context'
import { TransportType } from '@/components/trips/TravelSegment'

const transportIcons: Record<TransportType, any> = {
  plane: Plane,
  car: Car,
  train: Train,
  bus: Bus,
  ferry: Ship,
  rental_car: Car
}

export function UpcomingTransport() {
  const { user } = useFirebase()
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadUpcomingSegments = async () => {
      try {
        const upcoming = await TravelSegmentModel.getUpcomingSegments(user.uid, 3)
        setSegments(upcoming)
      } catch (error) {
        console.error('Error loading upcoming transport:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUpcomingSegments()
  }, [user])

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  const getTimeUntil = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Transport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Transport</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No upcoming transport scheduled
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Transport</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {segments.map(segment => {
          const Icon = transportIcons[segment.type]
          const isUrgent = segment.departureDate.getTime() - Date.now() < 24 * 60 * 60 * 1000 // Less than 24 hours
          
          return (
            <div 
              key={segment.id} 
              className={`p-3 rounded-lg border ${
                isUrgent ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    isUrgent ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-muted'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {segment.fromLocation}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {segment.toLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{getDateLabel(segment.departureDate)}</span>
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{segment.departureTime}</span>
                    </div>
                    {segment.flightNumber && (
                      <Badge variant="outline" className="text-xs">
                        {segment.flightNumber}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getTimeUntil(segment.departureDate)}
                  </p>
                  {segment.bookingLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs mt-1"
                      onClick={() => window.open(segment.bookingLink, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}