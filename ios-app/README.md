# NovaTrek iOS App

Native iOS companion app for NovaTrek travel planning platform.

## Features

### Core Functionality
- **Trip Management**: View and manage your travel itineraries
- **Packing Lists**: Create and manage packing lists with reminders
- **Offline Access**: Access your trip details without internet connection
- **Push Notifications**: Get reminders for flights, hotels, and activities
- **Real-time Updates**: Sync with web app for latest changes

### Planned Features
- Location-based suggestions and alerts
- Travel document storage
- Expense tracking
- Group trip coordination
- Weather alerts

## Setup

### Prerequisites
- Xcode 15.0+
- iOS 16.0+ deployment target
- CocoaPods or Swift Package Manager
- Firebase project configuration

### Installation

1. Clone the repository
2. Navigate to the iOS app directory:
   ```bash
   cd ios-app
   ```

3. Install dependencies:
   ```bash
   # Using CocoaPods
   pod install
   
   # Or using Swift Package Manager
   xed .
   ```

4. Add your `GoogleService-Info.plist` from Firebase Console

5. Create `Config.swift` from the template:
   ```bash
   cp Config.example.swift Config.swift
   ```

6. Update `Config.swift` with your API endpoints

7. Open `NovaTrek.xcworkspace` (if using CocoaPods) or `NovaTrek.xcodeproj`

8. Build and run the project

## Architecture

### Project Structure
```
ios-app/
├── NovaTrek/
│   ├── App/
│   │   ├── NovaTrekApp.swift
│   │   └── Config.swift
│   ├── Models/
│   │   ├── Trip.swift
│   │   ├── PackingItem.swift
│   │   └── User.swift
│   ├── Views/
│   │   ├── Trips/
│   │   ├── Packing/
│   │   └── Profile/
│   ├── Services/
│   │   ├── APIService.swift
│   │   ├── AuthService.swift
│   │   └── NotificationService.swift
│   └── Resources/
├── NovaTrekTests/
└── NovaTrekUITests/
```

### Key Components

- **SwiftUI**: Modern declarative UI framework
- **Firebase**: Authentication and real-time database
- **Combine**: Reactive programming for data flow
- **Core Data**: Offline data persistence

## API Integration

The iOS app communicates with the Next.js backend API:

- Base URL: `https://your-domain.com/api/` (configured in Config.swift)
- Authentication: Firebase Auth tokens
- Endpoints: Uses the V2 API structure (`/api/trips-v2/`, etc.)
- Collections: `trips-v2`, with subcollections for `days` and `activities`

## Development

### Code Style
- Follow Swift API Design Guidelines
- Use SwiftLint for code consistency
- Write unit tests for business logic
- Use async/await for asynchronous code

### Testing
```bash
# Run unit tests
xcodebuild test -scheme NovaTrek

# Run UI tests
xcodebuild test -scheme NovaTrekUITests
```

### Release
1. Update version and build number
2. Archive the app in Xcode
3. Upload to App Store Connect
4. Submit for review

## Contributing

This app is part of the NovaTrek monorepo. When making changes:

1. Ensure compatibility with the web API
2. Update TypeScript interfaces if data models change
3. Test offline functionality
4. Verify push notifications work correctly

## License

[Your License Here]