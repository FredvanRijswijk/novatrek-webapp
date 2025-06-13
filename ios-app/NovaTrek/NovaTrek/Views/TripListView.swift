import SwiftUI

struct TripListView: View {
    @StateObject private var tripService = TripService()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var isLoading = false
    @State private var showingCreateTrip = false
    @State private var errorMessage: String?
    @State private var showingProfile = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if tripService.isLoading && tripService.trips.isEmpty {
                    ProgressView()
                        .scaleEffect(1.5)
                } else if tripService.trips.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "airplane")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("No trips yet")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Button("Create Your First Trip") {
                            showingCreateTrip = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    List(tripService.trips) { trip in
                        NavigationLink(destination: TripDetailView(trip: trip)) {
                            TripRowView(trip: trip)
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                }
            }
            .navigationTitle("My Trips")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        showingProfile = true
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreateTrip = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateTrip) {
                CreateTripView { newTrip in
                    // Trip will be automatically added via Firestore listener
                }
            }
            .sheet(isPresented: $showingProfile) {
                ProfileView()
                    .environmentObject(authViewModel)
            }
            .onAppear {
                if let userId = authViewModel.firebaseUser?.uid {
                    print("Starting Firestore listener for user: \(userId)")
                    tripService.fetchTrips(userId: userId)
                }
            }
            .refreshable {
                if let userId = authViewModel.firebaseUser?.uid {
                    tripService.fetchTrips(userId: userId)
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") {
                    errorMessage = nil
                }
            } message: {
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                }
            }
        }
    }
}

struct TripRowView: View {
    let trip: Trip
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(trip.name)
                    .font(.headline)
                HStack {
                    Text(trip.destinationName ?? trip.mainDestination?.name ?? "Unknown destination")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatDateRange(trip.startDate, trip.endDate))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
    }
    
    private func formatDateRange(_ start: Date, _ end: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        let startStr = formatter.string(from: start)
        formatter.dateFormat = "MMM d, yyyy"
        let endStr = formatter.string(from: end)
        return "\(startStr) - \(endStr)"
    }
}

#Preview {
    TripListView()
}