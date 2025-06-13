import SwiftUI

struct PackingListView: View {
    let trip: Trip
    @State private var packingList: PackingList?
    @State private var isLoading = true
    @State private var newItemText = ""
    @State private var selectedCategory = "Other"
    
    let categories = ["Clothing", "Toiletries", "Electronics", "Documents", "Other"]
    
    var body: some View {
        VStack {
            if isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let packingList = packingList {
                List {
                    ForEach(categories, id: \.self) { category in
                        let items = packingList.items.filter { $0.category == category }
                        if !items.isEmpty {
                            Section(category) {
                                ForEach(items) { item in
                                    PackingItemRow(item: item) {
                                        toggleItem(item)
                                    }
                                }
                            }
                        }
                    }
                    
                    Section("Add Item") {
                        HStack {
                            TextField("New item", text: $newItemText)
                            
                            Picker("Category", selection: $selectedCategory) {
                                ForEach(categories, id: \.self) { category in
                                    Text(category).tag(category)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .labelsHidden()
                            
                            Button {
                                addItem()
                            } label: {
                                Image(systemName: "plus.circle.fill")
                            }
                            .disabled(newItemText.isEmpty)
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "bag")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("No packing list yet")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Button("Generate Packing List") {
                        generatePackingList()
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .task {
            await loadPackingList()
        }
    }
    
    private func loadPackingList() async {
        // In a real app, this would fetch from the API
        // For now, we'll simulate with sample data
        await MainActor.run {
            isLoading = false
            // Check if trip has packing list
            if let packingListId = trip.packingListId {
                // Simulate loading
                packingList = PackingList(
                    id: packingListId,
                    tripId: trip.id ?? "",
                    items: [
                        PackingItem(id: "1", name: "T-shirts", category: "Clothing", quantity: 5, isPacked: false),
                        PackingItem(id: "2", name: "Jeans", category: "Clothing", quantity: 2, isPacked: true),
                        PackingItem(id: "3", name: "Toothbrush", category: "Toiletries", quantity: 1, isPacked: false),
                        PackingItem(id: "4", name: "Phone charger", category: "Electronics", quantity: 1, isPacked: false),
                        PackingItem(id: "5", name: "Passport", category: "Documents", quantity: 1, isPacked: true)
                    ],
                    createdAt: Date(),
                    updatedAt: Date()
                )
            }
        }
    }
    
    private func generatePackingList() {
        // In a real app, this would call the API to generate a packing list
        isLoading = true
        Task {
            // Simulate API call
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run {
                packingList = PackingList(
                    id: UUID().uuidString,
                    tripId: trip.id ?? "",
                    items: generateDefaultItems(),
                    createdAt: Date(),
                    updatedAt: Date()
                )
                isLoading = false
            }
        }
    }
    
    private func generateDefaultItems() -> [PackingItem] {
        [
            PackingItem(id: UUID().uuidString, name: "T-shirts", category: "Clothing", quantity: 5, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Jeans", category: "Clothing", quantity: 2, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Underwear", category: "Clothing", quantity: 7, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Toothbrush", category: "Toiletries", quantity: 1, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Shampoo", category: "Toiletries", quantity: 1, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Phone charger", category: "Electronics", quantity: 1, isPacked: false),
            PackingItem(id: UUID().uuidString, name: "Passport", category: "Documents", quantity: 1, isPacked: false)
        ]
    }
    
    private func toggleItem(_ item: PackingItem) {
        guard var list = packingList,
              let index = list.items.firstIndex(where: { $0.id == item.id }) else { return }
        
        list.items[index].isPacked.toggle()
        packingList = list
        
        // In a real app, this would update the API
    }
    
    private func addItem() {
        guard var list = packingList else { return }
        
        let newItem = PackingItem(
            id: UUID().uuidString,
            name: newItemText,
            category: selectedCategory,
            quantity: 1,
            isPacked: false
        )
        
        list.items.append(newItem)
        packingList = list
        newItemText = ""
        
        // In a real app, this would update the API
    }
}

struct PackingItemRow: View {
    let item: PackingItem
    let onToggle: () -> Void
    
    var body: some View {
        HStack {
            Button(action: onToggle) {
                Image(systemName: item.isPacked ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(item.isPacked ? .green : .gray)
            }
            .buttonStyle(PlainButtonStyle())
            
            Text(item.name)
                .strikethrough(item.isPacked)
                .foregroundColor(item.isPacked ? .secondary : .primary)
            
            Spacer()
            
            if item.quantity > 1 {
                Text("x\(item.quantity)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}