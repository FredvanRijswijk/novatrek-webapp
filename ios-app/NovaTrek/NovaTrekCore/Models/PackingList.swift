import Foundation
import FirebaseFirestore

// MARK: - Packing List Models

public struct PackingList: Codable, Identifiable {
    @DocumentID public var id: String?
    public let userId: String?
    public let tripId: String
    public let name: String?
    public let isTemplate: Bool?
    public let templateType: PackingTemplateType?
    public var categories: [PackingCategory]?
    public var items: [PackingItem] {
        get {
            // Flatten all items from categories
            categories?.flatMap { $0.items } ?? []
        }
        set {
            // Group items by category for internal storage
            let groupedItems = Dictionary(grouping: newValue, by: { $0.category })
            self.categories = groupedItems.map { category, items in
                PackingCategory(id: category, name: category, icon: nil, color: nil, order: 0, items: items)
            }
        }
    }
    public let createdAt: Date
    public let updatedAt: Date
    public let isShared: Bool?
    public let sharedWith: [String]?
    
    public init(id: String?, tripId: String, items: [PackingItem], createdAt: Date, updatedAt: Date) {
        self.id = id
        self.userId = nil
        self.tripId = tripId
        self.name = nil
        self.isTemplate = false
        self.templateType = nil
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isShared = false
        self.sharedWith = []
        
        // Group items by category for internal storage
        let groupedItems = Dictionary(grouping: items, by: { $0.category })
        self.categories = groupedItems.map { category, items in
            PackingCategory(id: category, name: category, icon: nil, color: nil, order: 0, items: items)
        }
    }
    
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
    public var items: [PackingItem]
    
    public init(id: String, name: String, icon: String?, color: String?, order: Int, items: [PackingItem]) {
        self.id = id
        self.name = name
        self.icon = icon
        self.color = color
        self.order = order
        self.items = items
    }
}

public struct PackingItem: Codable, Identifiable {
    public let id: String
    public let name: String
    public let quantity: Int
    public var isPacked: Bool
    public let category: String
    public let notes: String?
    public let weight: Double?
    public let priority: PackingPriority?
    public let addedBy: String?
    public let packedBy: String?
    public let packedAt: Date?
    
    public init(id: String, name: String, category: String, quantity: Int = 1, isPacked: Bool = false) {
        self.id = id
        self.name = name
        self.category = category
        self.quantity = quantity
        self.isPacked = isPacked
        self.notes = nil
        self.weight = nil
        self.priority = nil
        self.addedBy = nil
        self.packedBy = nil
        self.packedAt = nil
    }
    
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