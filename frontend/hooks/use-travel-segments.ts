import { useState, useEffect } from 'react'
import { TravelSegmentModel } from '@/lib/models/travel-segment'
import { TravelSegment } from '@/components/trips/TravelSegment'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'

export function useTravelSegments(tripId: string) {
  const [segments, setSegments] = useState<TravelSegment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) return

    const unsubscribe = TravelSegmentModel.subscribeToTripSegments(
      tripId,
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
  }, [tripId])

  // Get segments for a specific date
  const getSegmentsForDate = (date: Date): TravelSegment[] => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    return segments.filter(segment => 
      isWithinInterval(segment.departureDate, { start: dayStart, end: dayEnd })
    )
  }

  // Get upcoming segments
  const getUpcomingSegments = (limit = 5): TravelSegment[] => {
    const now = new Date()
    return segments
      .filter(segment => segment.departureDate >= now)
      .slice(0, limit)
  }

  return {
    segments,
    loading,
    getSegmentsForDate,
    getUpcomingSegments
  }
}