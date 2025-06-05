'use client'

import { useEffect, useState, useCallback } from 'react'
import { useFirebase } from '@/lib/firebase'
import { TripModel, UserModel, type Trip, type User } from '@/lib/models'
import { Button } from '@/components/ui/button'
import { Plus, MessageCircle, MapPin, Calendar, Plane } from 'lucide-react'

export default function DashboardPage() {
  const { user: authUser, isAuthenticated, loading } = useFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const loadUserData = useCallback(async () => {
    if (!authUser) return

    try {
      setLoadingData(true)

      // Create or update user profile
      const userData = await UserModel.createOrUpdateFromAuth({
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
      })
      setUser(userData)

      // Load user's trips (with error handling)
      try {
        const userTrips = await TripModel.getUserTrips(authUser.uid)
        setTrips(userTrips)
      } catch (error) {
        console.log('No trips found or permission denied:', error)
        setTrips([])
      }

      // Load upcoming trips (with error handling)
      try {
        const upcoming = await TripModel.getUpcomingTrips(authUser.uid)
        setUpcomingTrips(upcoming)
      } catch (error) {
        console.log('No upcoming trips found or permission denied:', error)
        setUpcomingTrips([])
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [authUser])

  useEffect(() => {
    if (!isAuthenticated || !authUser) {
      setLoadingData(false)
      return
    }

    loadUserData()
  }, [isAuthenticated, authUser, loadUserData])

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          <span className="text-lg">Loading your travel dashboard...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 px-4">
        <h2 className="text-2xl font-bold mb-4">Welcome to NovaTrek</h2>
        <p className="text-muted-foreground mb-6 text-center">Please sign in to start planning your adventures</p>
        <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
    )
  }

  const activeTrip = trips.find(trip => trip.status === 'active')
  const recentTrips = trips.slice(0, 6)

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.displayName || 'Traveler'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready for your next adventure?
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/chat'}>
              <MessageCircle className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </div>
        </div>

        {/* Active Trip */}
        {activeTrip && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Current Trip</h3>
                <h4 className="text-2xl font-bold">{activeTrip.title}</h4>
                <p className="text-muted-foreground">
                  {activeTrip.destinations && activeTrip.destinations.length > 0
                    ? activeTrip.destinations.map(d => d.destination.city).join(' → ')
                    : activeTrip.destination
                    ? `${activeTrip.destination.city}, ${activeTrip.destination.country}`
                    : 'No destination'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full">
                    Day {Math.floor((new Date().getTime() - new Date(activeTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} of {TripModel.getDuration(activeTrip)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {TripModel.getProgress(activeTrip)}% complete
                  </span>
                </div>
              </div>
              <Button>View Details</Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Plus className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Plan New Trip</h3>
                <p className="text-sm text-muted-foreground">Start planning your next adventure</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/chat'}>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold">AI Travel Assistant</h3>
                <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">View Itineraries</h3>
                <p className="text-sm text-muted-foreground">Manage your trip schedules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Trips</h2>
          {recentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {trip.destinations && trip.destinations.length > 0
                          ? trip.destinations.map(d => d.destination.city).join(' → ')
                          : trip.destination
                          ? `${trip.destination.city}, ${trip.destination.country}`
                          : 'No destination'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trip.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      trip.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                      trip.status === 'booked' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Plane className="w-4 h-4" />
                    <span>{TripModel.getDuration(trip)} days</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-4">Start planning your first adventure!</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Trip
              </Button>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">{trips.length}</p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingTrips.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {trips.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(trips.flatMap(t => 
                    t.destinations && t.destinations.length > 0
                      ? t.destinations.map(d => d.destination.country)
                      : t.destination ? [t.destination.country] : []
                  )).size}
                </p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}