'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Copy, 
  LogIn,
  Lock,
  Users,
  Loader2,
  Share2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { getTripShare, updateShareAccess, copySharedTrip } from '@/lib/firebase/sharing'
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced'
import { useFirebase } from '@/lib/firebase/context'
import type { Trip } from '@/types/travel'
import type { TripShare } from '@/types/sharing'

export default function SharedTripPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [share, setShare] = useState<TripShare | null>(null)
  const [error, setError] = useState<string | null>(null)

  const shareToken = params.token as string

  useEffect(() => {
    loadSharedTrip()
  }, [shareToken])

  const loadSharedTrip = async () => {
    try {
      // Get share details
      const shareData = await getTripShare(shareToken)
      if (!shareData) {
        setError('This share link is invalid or has expired')
        setLoading(false)
        return
      }

      setShare(shareData)

      // Update access count
      await updateShareAccess(shareData.id)

      // Load trip data
      const tripData = await TripModel.getById(shareData.tripId)
      if (!tripData) {
        setError('Trip not found')
        setLoading(false)
        return
      }

      setTrip(tripData)
    } catch (error) {
      console.error('Error loading shared trip:', error)
      setError('Failed to load trip')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTrip = async () => {
    if (!user) {
      toast.error('Please sign in to copy this trip')
      router.push(`/auth/signin?redirect=/shared/trip/${shareToken}`)
      return
    }

    if (!share || !share.permissions.copy) {
      toast.error('This trip cannot be copied')
      return
    }

    setCopying(true)
    try {
      const newTripId = await copySharedTrip(shareToken, user.uid)
      if (newTripId) {
        toast.success('Trip copied successfully!')
        router.push(`/dashboard/trips/${newTripId}/plan`)
      } else {
        toast.error('Failed to copy trip')
      }
    } catch (error) {
      console.error('Error copying trip:', error)
      toast.error('Failed to copy trip')
    } finally {
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Load Trip</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!trip || !share) return null

  const tripDuration = trip.destinations.reduce((total, dest) => {
    return total + differenceInDays(new Date(dest.endDate), new Date(dest.startDate)) + 1
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              {trip.description && (
                <p className="text-muted-foreground mt-2">{trip.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {share.permissions.copy && (
                <Button 
                  onClick={handleCopyTrip}
                  disabled={copying}
                >
                  {copying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to My Trips
                    </>
                  )}
                </Button>
              )}
              {!user && (
                <Button variant="outline" onClick={() => router.push('/auth/signin')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Trip Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(trip.destinations[0].startDate), 'MMM d')} - 
                      {format(new Date(trip.destinations[trip.destinations.length - 1].endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tripDuration} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{trip.travelers} travelers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trip.destinations.map((destination, index) => (
                    <div key={destination.id} className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{destination.location.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(destination.startDate), 'MMM d')} - 
                          {format(new Date(destination.endDate), 'MMM d, yyyy')}
                          {' '}({differenceInDays(new Date(destination.endDate), new Date(destination.startDate)) + 1} days)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Itinerary Preview */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Itinerary Preview</CardTitle>
                  <CardDescription>
                    Day-by-day activities and plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trip.itinerary.slice(0, 3).map((day) => (
                      <div key={day.id}>
                        <h4 className="font-medium mb-2">Day {day.dayNumber} - {day.date}</h4>
                        <div className="space-y-2">
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-2 text-sm">
                              <Badge variant="outline" className="mt-0.5">
                                {activity.time || activity.startTime || 'All day'}
                              </Badge>
                              <div>
                                <p className="font-medium">{activity.name}</p>
                                {activity.location && (
                                  <p className="text-muted-foreground">
                                    {typeof activity.location === 'string' 
                                      ? activity.location 
                                      : activity.location.name || activity.location.address || 'Location'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {trip.itinerary.length > 3 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      And {trip.itinerary.length - 3} more days...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Permissions</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${share.permissions.view ? 'bg-green-500' : 'bg-gray-300'}`} />
                      View itinerary
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${share.permissions.copy ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Copy to account
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${share.permissions.comment ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Leave comments
                    </div>
                  </div>
                </div>
                
                {share.expiresAt && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Expires</p>
                    <p className="text-sm text-muted-foreground">
                      {format(share.expiresAt instanceof Date ? share.expiresAt : new Date(share.expiresAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Shared {format(share.createdAt instanceof Date ? share.createdAt : new Date(share.createdAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Viewed {share.accessCount} times
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Budget Summary */}
            {trip.budget && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Budget</span>
                      <span className="font-medium">${trip.budget.total}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Per Person</span>
                      <span>${Math.round(trip.budget.total / trip.travelers)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}