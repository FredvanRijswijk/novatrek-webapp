import Foundation
import FirebaseFirestore
import FirebaseAuth
import Combine

public class TripService: ObservableObject {
    private let api = APIService.shared
    private let db = Firestore.firestore()
    
    @Published public var trips: [Trip] = []
    @Published public var isLoading = false
    @Published public var error: Error?
    
    private var cancellables = Set<AnyCancellable>()
    private var tripsListener: ListenerRegistration?
    
    public init() {}
    
    // MARK: - Trip Management
    
    public func fetchTrips(userId: String) {
        isLoading = true
        error = nil
        
        tripsListener?.remove()
        
        tripsListener = db.collection("trips")
            .whereField("userId", isEqualTo: userId)
            .order(by: "startDate", descending: false)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                if let error = error {
                    print("Firestore error: \(error)")
                    self?.error = error
                    return
                }
                
                guard let documents = snapshot?.documents else { 
                    print("No documents in snapshot")
                    return 
                }
                
                print("Found \(documents.count) trip documents")
                
                do {
                    self?.trips = try documents.compactMap { document in
                        print("Document ID: \(document.documentID)")
                        print("Document data: \(document.data())")
                        let trip = try document.data(as: Trip.self)
                        return trip
                    }
                    print("Successfully parsed \(self?.trips.count ?? 0) trips")
                } catch {
                    print("Error parsing trips: \(error)")
                    self?.error = error
                }
            }
    }
    
    public func createTrip(_ tripData: TripCreateData) async throws -> Trip {
        let response: TripResponse = try await api.request(
            "/trips",
            method: .post,
            parameters: tripData.asDictionary()
        )
        return response.trip
    }
    
    public func fetchTrips() async throws -> [Trip] {
        guard let userId = Auth.auth().currentUser?.uid else {
            throw APIError.unauthorized
        }
        let response: TripsResponse = try await api.request("/trips?userId=\(userId)")
        return response.trips
    }
    
    public func updateTrip(_ trip: Trip) async throws -> Trip {
        guard let tripId = trip.id else {
            throw APIError.notFound
        }
        
        let response: TripResponse = try await api.request(
            "/trips/\(tripId)",
            method: .put,
            parameters: trip.asDictionary()
        )
        return response.trip
    }
    
    public func deleteTrip(_ tripId: String) async throws {
        let _: EmptyResponse = try await api.request(
            "/trips/\(tripId)",
            method: .delete
        )
    }
    
    // MARK: - Itinerary Management
    
    public func fetchItinerary(tripId: String) async throws -> [Day] {
        let response: ItineraryResponse = try await api.request(
            "/trips/\(tripId)/days"
        )
        return response.days
    }
    
    public func fetchActivities(tripId: String, dayId: String) async throws -> [Activity] {
        let response: ActivitiesResponse = try await api.request(
            "/trips/\(tripId)/days/\(dayId)/activities"
        )
        return response.activities
    }
    
    public func createActivity(tripId: String, dayId: String, activity: Activity) async throws -> Activity {
        let response: ActivityResponse = try await api.request(
            "/trips/\(tripId)/days/\(dayId)/activities",
            method: .post,
            parameters: activity.asDictionary()
        )
        return response.activity
    }
    
    // MARK: - Offline Support
    
    public func enableOfflineSupport() {
        let settings = FirestoreSettings()
        settings.isPersistenceEnabled = true
        settings.cacheSizeBytes = FirestoreCacheSizeUnlimited
        db.settings = settings
    }
    
    public func syncTripsForOffline(tripIds: [String]) async throws {
        for tripId in tripIds {
            // Fetch and cache trip data
            _ = try await db.collection("trips-v2").document(tripId).getDocument(source: .server)
            
            // Fetch and cache days
            let days = try await db.collection("trips-v2").document(tripId)
                .collection("days").getDocuments(source: .server)
            
            // Fetch and cache activities for each day
            for day in days.documents {
                _ = try await db.collection("trips-v2").document(tripId)
                    .collection("days").document(day.documentID)
                    .collection("activities").getDocuments(source: .server)
            }
        }
    }
    
    // Debug method to check all trips
    public func debugFetchAllTrips() {
        db.collection("trips").limit(to: 5).getDocuments { snapshot, error in
            if let error = error {
                print("Debug fetch error: \(error)")
                return
            }
            
            print("=== DEBUG: All trips in collection ===")
            snapshot?.documents.forEach { doc in
                print("Document ID: \(doc.documentID)")
                print("Data: \(doc.data())")
                print("---")
            }
        }
    }
    
    deinit {
        tripsListener?.remove()
    }
}

// MARK: - Response Models

struct TripResponse: Codable {
    let trip: Trip
}

struct TripsResponse: Codable {
    let trips: [Trip]
}

struct ItineraryResponse: Codable {
    let days: [Day]
}

struct ActivitiesResponse: Codable {
    let activities: [Activity]
}

struct ActivityResponse: Codable {
    let activity: Activity
}

struct EmptyResponse: Codable {}

// MARK: - Encodable Extension

extension Encodable {
    func asDictionary() -> [String: Any] {
        guard let data = try? JSONEncoder().encode(self),
              let dictionary = try? JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
            return [:]
        }
        return dictionary
    }
}
