import SwiftUI
import FirebaseAuth

struct AuthenticationView: View {
    @StateObject private var viewModel = AuthenticationViewModel()
    @State private var isShowingSignUp = false
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(
                    colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    VStack(spacing: 10) {
                        Image(systemName: "airplane.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.white)
                        
                        Text("NovaTrek")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Plan your perfect journey")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.top, 50)
                    
                    VStack(spacing: 20) {
                        VStack(spacing: 15) {
                            TextField("Email", text: $viewModel.email)
                                .textFieldStyle(AuthTextFieldStyle())
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                            
                            SecureField("Password", text: $viewModel.password)
                                .textFieldStyle(AuthTextFieldStyle())
                            
                            if isShowingSignUp {
                                SecureField("Confirm Password", text: $viewModel.confirmPassword)
                                    .textFieldStyle(AuthTextFieldStyle())
                            }
                        }
                        
                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.horizontal)
                        }
                        
                        Button {
                            if isShowingSignUp {
                                viewModel.signUp()
                            } else {
                                viewModel.signIn()
                            }
                        } label: {
                            Text(isShowingSignUp ? "Sign Up" : "Sign In")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.black.opacity(0.7))
                                .cornerRadius(10)
                        }
                        .disabled(viewModel.isLoading)
                        
                        if !isShowingSignUp {
                            Button {
                                viewModel.signInWithGoogle()
                            } label: {
                                HStack {
                                    Image(systemName: "globe")
                                    Text("Sign in with Google")
                                }
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red.opacity(0.8))
                                .cornerRadius(10)
                            }
                            .disabled(viewModel.isLoading)
                        }
                        
                        Button {
                            withAnimation {
                                isShowingSignUp.toggle()
                                viewModel.errorMessage = nil
                            }
                        } label: {
                            Text(isShowingSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                                .font(.footnote)
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, 30)
                    
                    Spacer()
                }
                
                if viewModel.isLoading {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    ProgressView()
                        .scaleEffect(1.5)
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                }
            }
        }
    }
}

struct AuthTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.9))
            .cornerRadius(10)
            .foregroundColor(.black)
    }
}

#Preview {
    AuthenticationView()
}