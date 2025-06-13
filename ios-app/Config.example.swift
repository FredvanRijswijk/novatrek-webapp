import Foundation

// Configuration for NovaTrek iOS App
// Copy this file to Config.swift and update with your values

struct Config {
    // API Configuration
    static let apiBaseURL = "https://your-domain.com/api"
    
    // Firebase Configuration
    // Add your GoogleService-Info.plist to the project
    
    // Feature Flags
    static let enableOfflineMode = true
    static let enablePushNotifications = true
    static let enableCrashReporting = true
    static let enableAnalytics = true
    
    // App Configuration
    static let appStoreURL = "https://apps.apple.com/app/idYOURAPPID"
    static let privacyPolicyURL = "https://your-domain.com/privacy"
    static let termsOfServiceURL = "https://your-domain.com/terms"
    static let supportEmail = "support@your-domain.com"
    
    // Third-party Services
    static let googleMapsAPIKey = "YOUR_GOOGLE_MAPS_API_KEY"
    static let weatherAPIKey = "YOUR_WEATHER_API_KEY"
    
    // Development Settings
    #if DEBUG
    static let isDebug = true
    static let logLevel = LogLevel.verbose
    #else
    static let isDebug = false
    static let logLevel = LogLevel.error
    #endif
    
    enum LogLevel {
        case verbose
        case debug
        case info
        case warning
        case error
    }
}