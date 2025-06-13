import Foundation
import FirebaseAuth
import FirebaseCore
import UIKit

@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var firebaseUser: FirebaseAuth.User?
    @Published var isAuthenticated = false
    
    private var authStateHandler: AuthStateDidChangeListenerHandle?
    
    init() {
        setupAuthStateListener()
    }
    
    deinit {
        if let authStateHandler = authStateHandler {
            Auth.auth().removeStateDidChangeListener(authStateHandler)
        }
    }
    
    private func setupAuthStateListener() {
        authStateHandler = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.firebaseUser = user
            self?.isAuthenticated = user != nil
        }
    }
    
    func signIn() {
        guard validateInput() else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await Auth.auth().signIn(withEmail: email, password: password)
                clearFields()
            } catch {
                errorMessage = handleAuthError(error)
            }
            isLoading = false
        }
    }
    
    func signUp() {
        guard validateInput(isSignUp: true) else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await Auth.auth().createUser(withEmail: email, password: password)
                clearFields()
            } catch {
                errorMessage = handleAuthError(error)
            }
            isLoading = false
        }
    }
    
    func signInWithGoogle() {
        // Note: Google Sign-In requires additional setup
        // This is a placeholder implementation
        errorMessage = "Google Sign-In requires additional configuration"
        
        // Uncomment and configure when Google Sign-In is set up:
        /*
        guard let presentingViewController = getRootViewController() else {
            errorMessage = "Could not find root view controller"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController)
                
                guard let idToken = result.user.idToken?.tokenString else {
                    errorMessage = "Failed to get Google ID token"
                    isLoading = false
                    return
                }
                
                let accessToken = result.user.accessToken.tokenString
                let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: accessToken)
                
                try await Auth.auth().signIn(with: credential)
                clearFields()
            } catch {
                errorMessage = handleAuthError(error)
            }
            isLoading = false
        }
        */
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            clearFields()
        } catch {
            errorMessage = "Failed to sign out: \(error.localizedDescription)"
        }
    }
    
    func resetPassword() {
        guard !email.isEmpty else {
            errorMessage = "Please enter your email address"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await Auth.auth().sendPasswordReset(withEmail: email)
                errorMessage = "Password reset email sent. Check your inbox."
            } catch {
                errorMessage = handleAuthError(error)
            }
            isLoading = false
        }
    }
    
    private func validateInput(isSignUp: Bool = false) -> Bool {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return false
        }
        
        guard email.contains("@") else {
            errorMessage = "Please enter a valid email address"
            return false
        }
        
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return false
        }
        
        if isSignUp {
            guard password == confirmPassword else {
                errorMessage = "Passwords do not match"
                return false
            }
        }
        
        return true
    }
    
    private func handleAuthError(_ error: Error) -> String {
        let nsError = error as NSError
        
        switch nsError.code {
        case AuthErrorCode.invalidEmail.rawValue:
            return "Invalid email address"
        case AuthErrorCode.userDisabled.rawValue:
            return "This account has been disabled"
        case AuthErrorCode.wrongPassword.rawValue:
            return "Incorrect password"
        case AuthErrorCode.userNotFound.rawValue:
            return "No account found with this email"
        case AuthErrorCode.emailAlreadyInUse.rawValue:
            return "This email is already in use"
        case AuthErrorCode.weakPassword.rawValue:
            return "Password is too weak"
        case AuthErrorCode.networkError.rawValue:
            return "Network error. Please check your connection"
        default:
            return error.localizedDescription
        }
    }
    
    private func clearFields() {
        email = ""
        password = ""
        confirmPassword = ""
        errorMessage = nil
    }
    
    private func getRootViewController() -> UIViewController? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return nil
        }
        return window.rootViewController
    }
}