import Foundation
import FirebaseFirestore

// MARK: - Trip Creation Data

public struct TripCreateData: Codable {
    public let title: String  // Changed to match Firestore
    public let destination: String
    public let startDate: Date
    public let endDate: Date
    public let travelers: [String]
    public let preferences: TripPreferences?
    
    public init(name: String, destination: String, startDate: Date, endDate: Date, travelers: [String], preferences: TripPreferences? = nil) {
        self.title = name  // Map name parameter to title field
        self.destination = destination
        self.startDate = startDate
        self.endDate = endDate
        self.travelers = travelers
        self.preferences = preferences
    }
}

public struct TripPreferences: Codable {
    public let budget: String?
    public let interests: [String]
    public let accommodationType: String?
    public let transportationType: String?
    
    public init(budget: String?, interests: [String], accommodationType: String?, transportationType: String?) {
        self.budget = budget
        self.interests = interests
        self.accommodationType = accommodationType
        self.transportationType = transportationType
    }
}

// MARK: - Trip Models

public struct Trip: Codable, Identifiable {
    @DocumentID public var id: String?
    public let userId: String
    public let title: String  // This matches your Firestore field
    public var name: String { title }  // Computed property for compatibility
    public let description: String?  // This matches your Firestore field
    public let startDate: Date
    public let endDate: Date
    public let status: String?  // Changed to String to match Firestore
    public let createdAt: Date
    public let updatedAt: Date
    
    // V2 specific fields that exist in your data
    public let destinationName: String?
    public let destinationId: String?
    
    // Complex fields - we'll handle these as optional for now
    // and can parse them later if needed
    public let destination: [String: Any]?
    public let destinationCoordinates: [String: String]?
    public let travelers: [[String: Any]]?
    public let budget: [String: Any]?
    public let userRef: DocumentReference?
    public let aiRecommendations: [[String: Any]]?
    
    // Make itinerary accessible through computed property
    public var itinerary: Itinerary? {
        // For now, return nil since we're not parsing the complex structure
        return nil
    }
    
    // Legacy/optional fields
    public let isAIGenerated: Bool?
    public let visibility: TripVisibility?
    public let tripDescription: String?
    public let coverImage: String?
    public let sharedWith: [String]?
    public let mainDestination: TripDestination?
    public let preferences: TripPreferences?
    public let packingListId: String?
    
    // Custom coding to handle the complex types
    enum CodingKeys: String, CodingKey {
        case id, userId, title, description, startDate, endDate, status
        case createdAt, updatedAt, destinationName, destinationId
        case destination, destinationCoordinates, travelers, budget
        case userRef, aiRecommendations
        case isAIGenerated, visibility, tripDescription, coverImage
        case sharedWith, mainDestination, preferences, packingListId
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Decode required fields
        self.userId = try container.decode(String.self, forKey: .userId)
        self.title = try container.decode(String.self, forKey: .title)
        self.startDate = try container.decode(Date.self, forKey: .startDate)
        self.endDate = try container.decode(Date.self, forKey: .endDate)
        self.createdAt = try container.decode(Date.self, forKey: .createdAt)
        self.updatedAt = try container.decode(Date.self, forKey: .updatedAt)
        
        // Decode optional fields
        self.description = try container.decodeIfPresent(String.self, forKey: .description)
        self.status = try container.decodeIfPresent(String.self, forKey: .status)
        self.destinationName = try container.decodeIfPresent(String.self, forKey: .destinationName)
        self.destinationId = try container.decodeIfPresent(String.self, forKey: .destinationId)
        
        // Skip complex fields for now - they won't cause decoding errors
        self.destination = nil
        self.destinationCoordinates = nil
        self.travelers = nil
        self.budget = nil
        self.userRef = nil
        self.aiRecommendations = nil
        
        // Legacy fields
        self.isAIGenerated = try container.decodeIfPresent(Bool.self, forKey: .isAIGenerated)
        self.visibility = try container.decodeIfPresent(TripVisibility.self, forKey: .visibility)
        self.tripDescription = try container.decodeIfPresent(String.self, forKey: .tripDescription)
        self.coverImage = try container.decodeIfPresent(String.self, forKey: .coverImage)
        self.sharedWith = try container.decodeIfPresent([String].self, forKey: .sharedWith)
        self.mainDestination = try container.decodeIfPresent(TripDestination.self, forKey: .mainDestination)
        self.preferences = try container.decodeIfPresent(TripPreferences.self, forKey: .preferences)
        self.packingListId = try container.decodeIfPresent(String.self, forKey: .packingListId)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        // Encode required fields
        try container.encode(userId, forKey: .userId)
        try container.encode(title, forKey: .title)
        try container.encode(startDate, forKey: .startDate)
        try container.encode(endDate, forKey: .endDate)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
        
        // Encode optional fields
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(status, forKey: .status)
        try container.encodeIfPresent(destinationName, forKey: .destinationName)
        try container.encodeIfPresent(destinationId, forKey: .destinationId)
        
        // Skip complex fields for encoding
        
        // Legacy fields
        try container.encodeIfPresent(isAIGenerated, forKey: .isAIGenerated)
        try container.encodeIfPresent(visibility, forKey: .visibility)
        try container.encodeIfPresent(tripDescription, forKey: .tripDescription)
        try container.encodeIfPresent(coverImage, forKey: .coverImage)
        try container.encodeIfPresent(sharedWith, forKey: .sharedWith)
        try container.encodeIfPresent(mainDestination, forKey: .mainDestination)
        try container.encodeIfPresent(preferences, forKey: .preferences)
        try container.encodeIfPresent(packingListId, forKey: .packingListId)
    }
    
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

// MARK: - Itinerary

public struct Itinerary: Codable {
    public let days: [ItineraryDay]
    
    public init(days: [ItineraryDay]) {
        self.days = days
    }
}

public struct ItineraryDay: Codable, Identifiable {
    public var id: String { "\(dayNumber)" }
    public let dayNumber: Int
    public let date: Date
    public let activities: [Activity]
    
    public init(dayNumber: Int, date: Date, activities: [Activity]) {
        self.dayNumber = dayNumber
        self.date = date
        self.activities = activities
    }
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
    public let tripId: String?
    public let dayId: String?
    public let name: String
    public let description: String?
    public let location: String?  // Simplified to String for now
    public let startTime: String?
    public let endTime: String?
    public let duration: Int?
    public let category: String  // Simplified to String
    public let cost: Double?
    public let currency: String?
    public let bookingUrl: String?
    public let bookingReference: String?
    public let notes: String?
    public let photos: [String]?
    public let isBooked: Bool?
    public let createdAt: Date?
    public let updatedAt: Date?
    public let order: Int?
    
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