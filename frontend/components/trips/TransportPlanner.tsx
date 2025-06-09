'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Ship,
  Plus,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { TravelSegmentCard, AddTravelSegment, TravelSegment, TransportType } from './TravelSegment'
import { TravelSegmentModel } from '@/lib/models/travel-segment'
import { useFirebase } from '@/lib/firebase/context'
import { format } from 'date-fns'
import { Trip } from '@/types/travel'

interface TransportPlannerProps {
  trip: Trip
  onUpdate?: () => void
}

export function TransportPlanner({ trip, onUpdate }: TransportPlannerProps) {
  const { user } = useFirebase()
  const [segments, setSegments] = useState<TravelSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!trip.id) return
    
    // Subscribe to travel segments
    const unsubscribe = TravelSegmentModel.subscribeToTripSegments(
      trip.id,
      (segmentData) => {
        const formattedSegments: TravelSegment[] = segmentData.map(seg => ({
          id: seg.id,
          type: seg.type,
          fromLocation: seg.fromLocation,
          toLocation: seg.toLocation,
          departureDate: seg.departureDate,
          departureTime: seg.departureTime,
          arrivalDate: seg.arrivalDate,
          arrivalTime: seg.arrivalTime,
          isOvernight: seg.isOvernight,
          operator: seg.operator,
          bookingNumber: seg.bookingNumber,
          confirmationNumber: seg.confirmationNumber,
          notes: seg.notes,
          flightNumber: seg.flightNumber,
          departureAirport: seg.departureAirport,
          arrivalAirport: seg.arrivalAirport,
          seatNumber: seg.seatNumber,
          trainNumber: seg.trainNumber,
          busNumber: seg.busNumber,
          departureStation: seg.departureStation,
          arrivalStation: seg.arrivalStation,
          rentalCompany: seg.rentalCompany,
          pickupLocation: seg.pickupLocation,
          dropoffLocation: seg.dropoffLocation,
          vehicleType: seg.vehicleType,
          ferryOperator: seg.ferryOperator,
          departurePort: seg.departurePort,
          arrivalPort: seg.arrivalPort,
          cabinNumber: seg.cabinNumber,
          bookingLink: seg.bookingLink,
          ticketUrl: seg.ticketUrl
        }))
        setSegments(formattedSegments)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [trip.id])

  const handleAddSegment = async (segmentData: Omit<TravelSegment, 'id'>) => {
    if (!user || !trip.id) return

    try {
      setSaving(true)
      await TravelSegmentModel.create({
        ...segmentData,
        tripId: trip.id,
        userId: user.uid
      })
      onUpdate?.()
    } catch (error) {
      console.error('Error adding travel segment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSegment = async (segment: TravelSegment) => {
    try {
      setSaving(true)
      const { id, ...updates } = segment
      await TravelSegmentModel.update(id, updates)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating travel segment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      setSaving(true)
      await TravelSegmentModel.delete(segmentId)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting travel segment:', error)
    } finally {
      setSaving(false)
    }
  }

  // Get default locations based on trip destinations
  const getDefaultLocations = () => {
    if (trip.destinations && trip.destinations.length > 1) {
      return {
        from: trip.destinations[0].destination?.name || '',
        to: trip.destinations[1].destination?.name || ''
      }
    } else if (trip.destination) {
      return {
        from: '',
        to: trip.destination.name || ''
      }
    }
    return { from: '', to: '' }
  }

  // Group segments by date
  const segmentsByDate = segments.reduce((acc, segment) => {
    const dateKey = format(segment.departureDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(segment)
    return acc
  }, {} as Record<string, TravelSegment[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Segments</CardDescription>
            <CardTitle className="text-2xl">{segments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flight Segments</CardDescription>
            <CardTitle className="text-2xl">
              {segments.filter(s => s.type === 'plane').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ground Transport</CardDescription>
            <CardTitle className="text-2xl">
              {segments.filter(s => ['car', 'train', 'bus', 'rental_car'].includes(s.type)).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Water Transport</CardDescription>
            <CardTitle className="text-2xl">
              {segments.filter(s => s.type === 'ferry').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Add Transport Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Travel Schedule</h3>
        <AddTravelSegment 
          onAdd={handleAddSegment}
          defaultFromLocation={getDefaultLocations().from}
          defaultToLocation={getDefaultLocations().to}
          defaultDate={trip.startDate}
        />
      </div>

      {/* Travel Segments List */}
      {segments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No transport added yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Add flights, trains, buses, or other transport to track how you'll get between destinations
                </p>
              </div>
              <AddTravelSegment 
                onAdd={handleAddSegment}
                defaultFromLocation={getDefaultLocations().from}
                defaultToLocation={getDefaultLocations().to}
                defaultDate={trip.startDate}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(segmentsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateSegments]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                {dateSegments
                  .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
                  .map(segment => (
                    <TravelSegmentCard
                      key={segment.id}
                      segment={segment}
                      onUpdate={handleUpdateSegment}
                      onDelete={() => handleDeleteSegment(segment.id)}
                    />
                  ))
                }
              </div>
            ))
        }
      </div>
      )}

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro tip:</strong> Add all your transport details including booking numbers and links. 
          You'll be able to access everything in one place during your trip.
        </AlertDescription>
      </Alert>
    </div>
  )
}