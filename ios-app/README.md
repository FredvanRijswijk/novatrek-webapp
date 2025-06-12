# NovaTrek iOS App

Native iOS application for NovaTrek - Your AI-powered travel planning companion.

## Overview

This is the native iOS app for NovaTrek, providing a mobile-first experience for travel planning, trip management, and on-the-go access to itineraries.

## Features

- **Trip Planning**: Create and manage multi-destination trips
- **AI Chat Assistant**: Get personalized travel recommendations
- **Offline Access**: Download trips for offline viewing
- **Real-time Sync**: Seamless sync with web platform
- **Native Features**: Push notifications, widgets, and shortcuts

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+
- CocoaPods or Swift Package Manager

## Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd web-app/ios-app
   ```

2. **Install dependencies**
   ```bash
   # If using CocoaPods
   pod install
   
   # Open the workspace
   open NovaTrek.xcworkspace
   ```

3. **Configure environment**
   - Copy `Config.example.swift` to `Config.swift`
   - Add your API keys and configuration

4. **Firebase Setup**
   - Add `GoogleService-Info.plist` to the project
   - Enable Authentication and Firestore in Firebase Console

## Architecture

### Project Structure
```
NovaTrek/
├── App/
│   ├── NovaTrekApp.swift    # App entry point
│   └── Config/               # Configuration files
├── Core/
│   ├── Models/               # Data models
│   ├── Services/             # API and business logic
│   └── Utilities/            # Helper functions
├── Features/
│   ├── Auth/                 # Authentication
│   ├── Trips/                # Trip management
│   ├── Chat/                 # AI chat interface
│   └── Profile/              # User profile
├── UI/
│   ├── Components/           # Reusable UI components
│   └── Theme/                # Colors, fonts, styles
└── Resources/
    ├── Assets.xcassets       # Images and colors
    └── Localizable.strings   # Translations
```

### Key Technologies

- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for data flow
- **Firebase SDK**: Authentication and real-time database
- **URLSession**: Networking with the NovaTrek API
- **Core Data**: Local data persistence
- **WidgetKit**: Home screen widgets

## API Integration

The iOS app communicates with the NovaTrek backend API hosted at:
- Development: `http://localhost:3000/api`
- Production: `https://app.novatrek.app/api`

### Authentication
- Uses Firebase Authentication SDK
- Supports Google Sign-In and Email/Password
- Tokens are automatically managed by Firebase

### Key Endpoints
- `/api/trips/list` - Get user's trips
- `/api/chat/stream` - AI chat streaming
- `/api/activities/search` - Search for activities
- `/api/places/photo` - Get place photos

## Development

### Code Style
- Follow Apple's Swift API Design Guidelines
- Use SwiftLint for code consistency
- Prefer value types (structs) over reference types
- Use async/await for asynchronous code

### Testing
```bash
# Run unit tests
xcodebuild test -scheme NovaTrek

# Run UI tests
xcodebuild test -scheme NovaTrekUITests
```

### Building
```bash
# Debug build
xcodebuild -scheme NovaTrek -configuration Debug

# Release build
xcodebuild -scheme NovaTrek -configuration Release
```

## Deployment

### TestFlight
1. Archive the app in Xcode (Product > Archive)
2. Upload to App Store Connect
3. Submit for TestFlight review

### App Store
1. Complete App Store listing
2. Submit for App Review
3. Release when approved

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## Support

- GitHub Issues: [repository-issues-url]
- Email: support@novatrek.app
- Documentation: [docs-url]

## License

Copyright © 2024 NovaTrek. All rights reserved.