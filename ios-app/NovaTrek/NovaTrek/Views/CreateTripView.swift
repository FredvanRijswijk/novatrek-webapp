import SwiftUI

struct CreateTripView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var tripService = TripService()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    
    @State private var tripName = ""
    @State private var destination = ""
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(7 * 24 * 60 * 60)
    @State private var travelers: [String] = [""]
    @State private var budget = ""
    @State private var selectedInterests: Set<String> = []
    @State private var isCreating = false
    @State private var errorMessage: String?
    
    let availableInterests = [
        "Culture", "History", "Art", "Food",
        "Nature", "Adventure", "Beach", "Shopping",
        "Nightlife", "Architecture", "Photography", "Sports"
    ]
    
    let onComplete: (Trip) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section("Trip Details") {
                    TextField("Trip Name", text: $tripName)
                    TextField("Destination", text: $destination)
                }
                
                Section("Dates") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: .date)
                }
                
                Section("Travelers") {
                    ForEach(0..<travelers.count, id: \.self) { index in
                        HStack {
                            TextField("Traveler Name", text: $travelers[index])
                            if travelers.count > 1 {
                                Button {
                                    travelers.remove(at: index)
                                } label: {
                                    Image(systemName: "minus.circle.fill")
                                        .foregroundColor(.red)
                                }
                            }
                        }
                    }
                    
                    Button {
                        travelers.append("")
                    } label: {
                        Label("Add Traveler", systemImage: "plus.circle.fill")
                    }
                }
                
                Section("Preferences") {
                    TextField("Budget", text: $budget)
                        .keyboardType(.decimalPad)
                    
                    VStack(alignment: .leading) {
                        Text("Interests")
                            .font(.headline)
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))]) {
                            ForEach(availableInterests, id: \.self) { interest in
                                InterestChip(
                                    interest: interest,
                                    isSelected: selectedInterests.contains(interest)
                                ) {
                                    if selectedInterests.contains(interest) {
                                        selectedInterests.remove(interest)
                                    } else {
                                        selectedInterests.insert(interest)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Create Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        createTrip()
                    }
                    .disabled(tripName.isEmpty || destination.isEmpty || isCreating)
                }
            }
            .disabled(isCreating)
            .overlay {
                if isCreating {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    ProgressView("Creating trip...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 5)
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
    
    private func createTrip() {
        isCreating = true
        
        Task {
            do {
                let tripData = TripCreateData(
                    name: tripName,
                    destination: destination,
                    startDate: startDate,
                    endDate: endDate,
                    travelers: travelers.filter { !$0.isEmpty },
                    preferences: TripPreferences(
                        budget: budget.isEmpty ? nil : budget,
                        interests: Array(selectedInterests),
                        accommodationType: nil,
                        transportationType: nil
                    )
                )
                
                let newTrip = try await tripService.createTrip(tripData)
                await MainActor.run {
                    onComplete(newTrip)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isCreating = false
                }
            }
        }
    }
}

struct InterestChip: View {
    let interest: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(interest)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(15)
        }
        .buttonStyle(PlainButtonStyle())
    }
}