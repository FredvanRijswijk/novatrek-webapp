import SwiftUI
import FirebaseAuth

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showingSignOutAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("Account Information") {
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(authViewModel.firebaseUser?.email ?? "Not available")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("User ID")
                        Spacer()
                        Text(authViewModel.firebaseUser?.uid ?? "Not available")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Display Name")
                        Spacer()
                        Text(authViewModel.firebaseUser?.displayName ?? "Not set")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Email Verified")
                        Spacer()
                        Image(systemName: authViewModel.firebaseUser?.isEmailVerified == true ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(authViewModel.firebaseUser?.isEmailVerified == true ? .green : .red)
                    }
                }
                
                Section("Account Created") {
                    if let creationDate = authViewModel.firebaseUser?.metadata.creationDate {
                        Text(creationDate, style: .date)
                    } else {
                        Text("Unknown")
                    }
                }
                
                Section("Last Sign In") {
                    if let lastSignIn = authViewModel.firebaseUser?.metadata.lastSignInDate {
                        Text(lastSignIn, style: .relative)
                    } else {
                        Text("Unknown")
                    }
                }
                
                Section {
                    Button(role: .destructive) {
                        showingSignOutAlert = true
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .confirmationDialog("Sign Out", isPresented: $showingSignOutAlert) {
                Button("Sign Out", role: .destructive) {
                    authViewModel.signOut()
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthenticationViewModel())
}