//
//  NovaTrekApp.swift
//  NovaTrek
//
//  Created by Fred van Rijswijk on 13/06/2025.
//

import SwiftUI
import FirebaseCore
import FirebaseAuth

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        FirebaseApp.configure()
        return true
    }
}

@main
struct NovaTrekApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var authViewModel = AuthenticationViewModel()
    
    var body: some Scene {
        WindowGroup {
            if authViewModel.isAuthenticated {
                TripListView()
                    .environmentObject(authViewModel)
            } else {
                AuthenticationView()
                    .environmentObject(authViewModel)
            }
        }
    }
}
