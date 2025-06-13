import Foundation
import FirebaseFirestore

// MARK: - Trip Models

public struct Trip: Codable, Identifiable {
    @DocumentID public var id: String?
    public let userId: String
    public let tripName: String
    public let startDate: Date
    public let endDate: Date
    public let status: TripStatus
    public let createdAt: Date
    public let updatedAt: Date
    public let isAIGenerated: Bool
    public let visibility: TripVisibility
    public let tripDescription: String?
    public let coverImage: String?
    public let sharedWith: [String]
    public let travelers: [String]
    public let mainDestination: TripDestination?
    
    // V2 specific fields
    public let destinationName: String?
    public let destinationCoordinates: GeoPoint?
    public let destinationId: String?
    
    public enum TripStatus: String, Codable, CaseIterable {
        case draft
        case planned
        case active
        case completed
        case cancelled
    }
    
    public enum TripVisibility: String, Codable {
        case `private`
        case shared
        case `public`
    }
}

public struct TripDestination: Codable, Identifiable {
    public let id: String
    public let name: String
    public let country: String?
    public let coordinates: GeoPoint
    public let arrivalDate: Date
    public let departureDate: Date
    public let timezone: String?
    public let currency: String?
    public let placeId: String?
    public let photoUrl: String?
}

// MARK: - Day Itinerary

public struct Day: Codable, Identifiable {
    @DocumentID public var id: String?
    public let tripId: String
    public let date: Date
    public let dayNumber: Int
    public let destinationId: String?
    public let destinationName: String?
    public let notes: String?
    public let createdAt: Date
    public let updatedAt: Date
}

// MARK: - Activity

public struct Activity: Codable, Identifiable {
    @DocumentID public var id: String?
    public let tripId: String
    public let dayId: String
    public let name: String
    public let description: String?
    public let location: Location?
    public let startTime: String?
    public let endTime: String?
    public let duration: Int?
    public let category: ActivityCategory
    public let cost: Double?
    public let currency: String?
    public let bookingUrl: String?
    public let bookingReference: String?
    public let notes: String?
    public let photos: [String]
    public let isBooked: Bool
    public let createdAt: Date
    public let updatedAt: Date
    public let order: Int
    
    // Google Places integration
    public let placeId: String?
    public let googleMapsUrl: String?
    public let rating: Double?
    public let priceLevel: Int?
    public let openingHours: [String]?
    public let phoneNumber: String?
    public let website: String?
    
    public enum ActivityCategory: String, Codable, CaseIterable {
        case sightseeing
        case dining
        case shopping
        case entertainment
        case outdoor
        case cultural
        case relaxation
        case nightlife
        case sports
        case transportation
        case other
    }
}

// MARK: - Location

public struct Location: Codable {
    public let address: String
    public let coordinates: GeoPoint?
    public let placeId: String?
    public let name: String?
    public let city: String?
    public let country: String?
}

// MARK: - Transportation

public struct Transportation: Codable, Identifiable {
    @DocumentID public var id: String?
    public let tripId: String
    public let type: TransportationType
    public let provider: String?
    public let departureLocation: Location
    public let arrivalLocation: Location
    public let departureTime: Date
    public let arrivalTime: Date
    public let bookingReference: String?
    public let cost: Double?
    public let currency: String?
    public let notes: String?
    public let isBooked: Bool
    public let createdAt: Date
    public let updatedAt: Date
    
    // Flight specific
    public let flightNumber: String?
    public let airline: String?
    public let seatNumber: String?
    public let terminal: String?
    public let gate: String?
    
    public enum TransportationType: String, Codable, CaseIterable {
        case flight
        case train
        case bus
        case car
        case ferry
        case cruise
        case other
    }
}

// MARK: - Accommodation

public struct Accommodation: Codable, Identifiable {
    @DocumentID public var id: String?
    public let tripId: String
    public let name: String
    public let type: AccommodationType
    public let location: Location
    public let checkInDate: Date
    public let checkOutDate: Date
    public let checkInTime: String?
    public let checkOutTime: String?
    public let bookingReference: String?
    public let cost: Double?
    public let currency: String?
    public let notes: String?
    public let amenities: [String]
    public let photos: [String]
    public let isBooked: Bool
    public let createdAt: Date
    public let updatedAt: Date
    
    // Contact info
    public let phoneNumber: String?
    public let email: String?
    public let website: String?
    
    public enum AccommodationType: String, Codable, CaseIterable {
        case hotel
        case hostel
        case airbnb
        case resort
        case motel
        case guesthouse
        case apartment
        case villa
        case other
    }
}

// MARK: - Expense

public struct Expense: Codable, Identifiable {
    @DocumentID public var id: String?
    public let tripId: String
    public let dayId: String?
    public let activityId: String?
    public let category: ExpenseCategory
    public let amount: Double
    public let currency: String
    public let description: String
    public let paymentMethod: String?
    public let paidBy: String?
    public let splitWith: [String]
    public let receipt: String?
    public let createdAt: Date
    public let updatedAt: Date
    
    public enum ExpenseCategory: String, Codable, CaseIterable {
        case accommodation
        case transportation
        case food
        case activities
        case shopping
        case entertainment
        case health
        case other
    }
}