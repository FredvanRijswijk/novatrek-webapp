import Foundation
import FirebaseFirestore

// MARK: - User Models

public struct User: Codable, Identifiable {
    @DocumentID public var id: String?
    public let email: String
    public let displayName: String?
    public let photoURL: String?
    public let createdAt: Date
    public let lastLogin: Date?
    public let preferences: UserPreferences
    public let subscription: UserSubscription?
    public let stripeCustomerId: String?
    public let isExpert: Bool
    public let expertProfile: ExpertProfile?
    public let fcmToken: String?
    public let notificationSettings: NotificationSettings
}

public struct UserPreferences: Codable {
    public let travelStyle: [TravelStyle]
    public let accommodationPreference: AccommodationPreference?
    public let activityTypes: [String]
    public let dietaryRestrictions: [String]
    public let accessibility: [String]
    public let budgetRange: BudgetRange?
    public let preferredCurrency: String
    public let temperatureUnit: TemperatureUnit
    public let distanceUnit: DistanceUnit
    public let language: String
    public let timezone: String
    
    public enum TravelStyle: String, Codable, CaseIterable {
        case adventure
        case relaxation
        case cultural
        case luxury
        case budget
        case family
        case solo
        case romantic
        case business
        case eco
    }
    
    public enum AccommodationPreference: String, Codable, CaseIterable {
        case luxury
        case midRange = "mid-range"
        case budget
        case hostel
        case unique
        case eco
    }
    
    public enum BudgetRange: String, Codable {
        case budget
        case moderate
        case luxury
        case unlimited
    }
    
    public enum TemperatureUnit: String, Codable {
        case celsius
        case fahrenheit
    }
    
    public enum DistanceUnit: String, Codable {
        case kilometers
        case miles
    }
}

public struct UserSubscription: Codable {
    public let status: SubscriptionStatus
    public let plan: SubscriptionPlan
    public let startDate: Date
    public let endDate: Date?
    public let stripeSubscriptionId: String?
    public let cancelAtPeriodEnd: Bool
    public let features: [String]
    
    public enum SubscriptionStatus: String, Codable {
        case active
        case canceled
        case pastDue = "past_due"
        case trialing
        case inactive
    }
    
    public enum SubscriptionPlan: String, Codable {
        case free
        case basic
        case premium
        case expert
    }
}

public struct ExpertProfile: Codable {
    public let bio: String
    public let specialties: [String]
    public let languages: [String]
    public let yearsOfExperience: Int
    public let certifications: [String]
    public let socialLinks: [String: String]
    public let rating: Double
    public let reviewCount: Int
    public let isVerified: Bool
    public let stripeAccountId: String?
    public let commissionRate: Double
}

public struct NotificationSettings: Codable {
    public let tripReminders: Bool
    public let flightAlerts: Bool
    public let packingReminders: Bool
    public let activityReminders: Bool
    public let weatherAlerts: Bool
    public let marketingEmails: Bool
    public let pushNotifications: Bool
    public let emailNotifications: Bool
    public let smsNotifications: Bool
    public let reminderTimeBeforeTrip: Int // hours
    public let reminderTimeBeforeActivity: Int // minutes
}