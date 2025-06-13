import SwiftUI

struct TripDetailView: View {
    let trip: Trip
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ItineraryView(trip: trip)
                .tabItem {
                    Label("Itinerary", systemImage: "calendar")
                }
                .tag(0)
            
            PackingListView(trip: trip)
                .tabItem {
                    Label("Packing", systemImage: "bag")
                }
                .tag(1)
            
            TripInfoView(trip: trip)
                .tabItem {
                    Label("Info", systemImage: "info.circle")
                }
                .tag(2)
        }
        .navigationTitle(trip.name)
        .navigationBarTitleDisplayMode(.large)
    }
}

struct ItineraryView: View {
    let trip: Trip
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if trip.itinerary == nil || trip.itinerary?.days.isEmpty == true {
                    VStack(spacing: 20) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("No itinerary yet")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Your trip itinerary will appear here")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.top, 100)
                } else if let days = trip.itinerary?.days {
                    ForEach(days, id: \.date) { day in
                        DayCardView(day: day)
                    }
                }
            }
            .padding()
        }
    }
}

struct DayCardView: View {
    let day: ItineraryDay
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Day \(day.dayNumber)")
                    .font(.headline)
                Spacer()
                Text(day.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            ForEach(day.activities, id: \.name) { activity in
                ActivityRowView(activity: activity)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActivityRowView: View {
    let activity: Activity
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: iconForCategory(activity.category))
                .foregroundColor(.accentColor)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(activity.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let location = activity.location {
                    Text(location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let description = activity.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            if let duration = activity.duration {
                Text("\(duration) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private func iconForCategory(_ category: String) -> String {
        switch category.lowercased() {
        case "restaurant", "food":
            return "fork.knife"
        case "attraction", "sightseeing":
            return "building.columns"
        case "activity", "entertainment":
            return "ticket"
        case "shopping":
            return "bag"
        case "transport":
            return "car"
        default:
            return "mappin.circle"
        }
    }
}

struct TripInfoView: View {
    let trip: Trip
    
    var body: some View {
        Form {
            Section("Destination") {
                Label(trip.destinationName ?? trip.mainDestination?.name ?? "Unknown destination", systemImage: "mappin.circle")
            }
            
            Section("Dates") {
                Label {
                    Text("\(trip.startDate, style: .date) - \(trip.endDate, style: .date)")
                } icon: {
                    Image(systemName: "calendar")
                }
            }
            
            if let travelers = trip.travelers, !travelers.isEmpty {
                Section("Travelers") {
                    ForEach(0..<travelers.count, id: \.self) { index in
                        if let travelerDict = travelers[index] as? [String: Any],
                           let name = travelerDict["name"] as? String {
                            Label(name, systemImage: "person")
                        }
                    }
                }
            }
            
            if let preferences = trip.preferences {
                Section("Preferences") {
                    if let budget = preferences.budget {
                        Label("Budget: \(budget)", systemImage: "dollarsign.circle")
                    }
                    
                    if !preferences.interests.isEmpty {
                        Label {
                            Text(preferences.interests.joined(separator: ", "))
                        } icon: {
                            Image(systemName: "star")
                        }
                    }
                }
            }
        }
    }
}