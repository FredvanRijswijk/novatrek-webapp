'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { TripModel, type Trip } from '@/lib/models'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import TravelChat from '@/components/chat/TravelChat'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const { user: authUser, isAuthenticated, loading } = useFirebase()
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [loadingTrips, setLoadingTrips] = useState(true)

  useEffect(() => {
    const loadTrips = async () => {
      if (!authUser) return

      try {
        const userTrips = await TripModel.getUserTrips(authUser.uid)
        setTrips(userTrips)
        if (userTrips.length > 0) {
          // Auto-select the most recent trip
          setSelectedTrip(userTrips[0])
        }
      } catch (error) {
        console.log('No trips found:', error)
        setTrips([])
      } finally {
        setLoadingTrips(false)
      }
    }

    if (isAuthenticated && authUser) {
      loadTrips()
    } else {
      setLoadingTrips(false)
    }
  }, [isAuthenticated, authUser])

  if (loading || loadingTrips) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            <span className="text-lg">Loading AI assistant...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 px-4">
          <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">AI Travel Assistant</h2>
          <p className="text-muted-foreground mb-6 text-center">Please sign in to chat with our AI assistant</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Travel Assistant</h1>
            <p className="text-muted-foreground mt-1">
              Get personalized travel recommendations and planning help
            </p>
          </div>

          {trips.length > 0 && (
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <span className="text-sm font-medium">Trip context:</span>
              <Select 
                value={selectedTrip?.id || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedTrip(null)
                  } else {
                    const trip = trips.find(t => t.id === value)
                    setSelectedTrip(trip || null)
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General travel chat</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {trip.destinations && trip.destinations.length > 0
                          ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                          : trip.destination?.name || trip.title || 'Unknown location'
                        }
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <TravelChat 
            tripContext={selectedTrip}
            className="w-full"
          />
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">What can I help you with?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Trip Planning:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>Destination recommendations</li>
                  <li>Itinerary optimization</li>
                  <li>Activity suggestions</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Travel Advice:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>Weather and seasonal tips</li>
                  <li>Budget planning</li>
                  <li>Transportation options</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}