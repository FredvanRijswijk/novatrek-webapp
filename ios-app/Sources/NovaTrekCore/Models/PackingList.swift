import Foundation
import FirebaseFirestore

// MARK: - Packing List Models

public struct PackingList: Codable, Identifiable {
    @DocumentID public var id: String?
    public let userId: String
    public let tripId: String?
    public let name: String
    public let isTemplate: Bool
    public let templateType: PackingTemplateType?
    public let categories: [PackingCategory]
    public let createdAt: Date
    public let updatedAt: Date
    public let isShared: Bool
    public let sharedWith: [String]
    
    public enum PackingTemplateType: String, Codable, CaseIterable {
        case beach
        case business
        case adventure
        case city
        case winter
        case camping
        case family
        case backpacking
        case luxury
        case weekend
    }
}

public struct PackingCategory: Codable, Identifiable {
    public let id: String
    public let name: String
    public let icon: String?
    public let color: String?
    public let order: Int
    public let items: [PackingItem]
}

public struct PackingItem: Codable, Identifiable {
    public let id: String
    public let name: String
    public let quantity: Int
    public let isPacked: Bool
    public let category: String
    public let notes: String?
    public let weight: Double?
    public let priority: PackingPriority
    public let addedBy: String?
    public let packedBy: String?
    public let packedAt: Date?
    
    public enum PackingPriority: String, Codable, CaseIterable {
        case essential
        case important
        case nice
        case optional
    }
}

// MARK: - Packing Reminders

public struct PackingReminder: Codable, Identifiable {
    @DocumentID public var id: String?
    public let packingListId: String
    public let userId: String
    public let reminderTime: Date
    public let reminderType: ReminderType
    public let isEnabled: Bool
    public let message: String?
    public let createdAt: Date
    
    public enum ReminderType: String, Codable {
        case beforeTrip
        case custom
        case recurring
    }
}