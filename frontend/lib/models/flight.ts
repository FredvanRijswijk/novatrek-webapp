import { 
  doc,
  DocumentReference,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection,
  deleteDocument,
  where,
  orderBy
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { User } from './user'
import { Trip } from '@/types/travel'

export interface FlightInfo {
  id: string
  tripId: string
  tripRef?: DocumentReference<Trip> // New reference field
  userId: string
  userRef?: DocumentReference<User> // New reference field
  
  // Flight details
  flightNumber: string
  airline: string
  departureAirport: string
  departureAirportCode: string
  arrivalAirport: string
  arrivalAirportCode: string
  
  // Times
  scheduledDepartureTime: Date
  scheduledArrivalTime: Date
  actualDepartureTime?: Date
  actualArrivalTime?: Date
  
  // Status
  status: 'scheduled' | 'delayed' | 'cancelled' | 'departed' | 'arrived'
  gate?: string
  terminal?: string
  baggage?: string
  
  // Additional info
  confirmationNumber?: string
  seatNumber?: string
  bookingReference?: string
  passengerName?: string
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

export class FlightModel {
  static readonly COLLECTION = 'flights'

  // Create a new flight with references
  static async create(flightData: Omit<FlightInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...flightData,
      status: flightData.status || 'scheduled'
    }

    // Add references alongside string IDs
    if (flightData.userId) {
      enhancedData.userRef = doc(db, 'users', flightData.userId)
    }
    if (flightData.tripId) {
      enhancedData.tripRef = doc(db, 'trips', flightData.tripId)
    }

    const docRef = await createDocument(this.COLLECTION, enhancedData)
    return docRef.id
  }

  // Get flight by ID
  static async getById(flightId: string): Promise<FlightInfo | null> {
    return await getDocument<FlightInfo>(this.COLLECTION, flightId)
  }

  // Get flights for a trip - uses references only
  static async getTripFlights(tripId: string): Promise<FlightInfo[]> {
    const tripRef = doc(db, 'trips', tripId)
    
    const flights = await getCollection<FlightInfo>(
      this.COLLECTION,
      where('tripRef', '==', tripRef),
      orderBy('scheduledDepartureTime', 'asc')
    )

    return flights
  }

  // Update flight
  static async update(flightId: string, updates: Partial<FlightInfo>): Promise<void> {
    let enhancedUpdates: any = { ...updates }

    // If userId is being updated, also update userRef
    if (updates.userId && !updates.hasOwnProperty('userRef')) {
      enhancedUpdates.userRef = doc(db, 'users', updates.userId)
    }
    
    // If tripId is being updated, also update tripRef
    if (updates.tripId && !updates.hasOwnProperty('tripRef')) {
      enhancedUpdates.tripRef = doc(db, 'trips', updates.tripId)
    }

    await updateDocument(this.COLLECTION, flightId, enhancedUpdates)
  }

  // Delete flight
  static async delete(flightId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, flightId)
  }

  // Check flight status (mock implementation - replace with real API)
  static async checkFlightStatus(flightNumber: string, date: Date): Promise<Partial<FlightInfo> | null> {
    // This is where you would integrate with a flight tracking API
    // For now, return mock data
    
    // Popular flight APIs to consider:
    // 1. FlightAware API - https://flightaware.com/commercial/data/
    // 2. Aviation Stack - https://aviationstack.com/
    // 3. FlightStats - https://developer.flightstats.com/
    // 4. AeroDataBox - https://www.aerodatabox.com/
    // 5. OpenSky Network - https://opensky-network.org/
    
    // Mock response
    return {
      status: 'scheduled',
      gate: 'A12',
      terminal: '2',
      scheduledDepartureTime: date,
      scheduledArrivalTime: new Date(date.getTime() + 3 * 60 * 60 * 1000) // 3 hours later
    }
  }

  // Parse flight details from confirmation email or text
  static parseFlightDetails(text: string): Partial<FlightInfo> | null {
    // Basic parsing logic - can be enhanced with AI
    const flightNumberMatch = text.match(/(?:Flight|FL)\s*#?\s*([A-Z]{2}\d{3,4})/i)
    const confirmationMatch = text.match(/(?:Confirmation|Booking)\s*(?:Number|Code|Reference):\s*([A-Z0-9]{6})/i)
    
    if (flightNumberMatch) {
      return {
        flightNumber: flightNumberMatch[1],
        confirmationNumber: confirmationMatch?.[1]
      }
    }
    
    return null
  }
}