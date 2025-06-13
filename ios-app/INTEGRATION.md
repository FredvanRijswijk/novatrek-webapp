# iOS App Integration with NovaTrek Monorepo

This document explains how the iOS app integrates with the rest of the NovaTrek monorepo.

## Monorepo Structure

```
web-app/
├── frontend/              # Next.js web application
│   ├── app/
│   │   └── api/          # API endpoints used by iOS app
│   ├── lib/
│   │   ├── models/       # TypeScript data models
│   │   └── services/     # Service layer
│   └── types/            # TypeScript type definitions
├── safari-extension/      # Safari extension (separate Xcode project)
├── browser-extension/     # Chrome/Firefox extension
├── ios-app/              # iOS native app (this directory)
└── firebase/             # Firebase configuration and rules
```

## Shared Resources

### 1. API Endpoints
The iOS app uses the same Next.js API endpoints as the web app:
- Base URL: `/api/` (configured in Config.swift)
- Authentication: Firebase Auth tokens in Authorization header
- All endpoints return JSON responses

### 2. Firebase Services
- **Authentication**: Same Firebase Auth instance
- **Firestore**: Same database with identical security rules
- **Storage**: Shared bucket for images and documents
- **Cloud Functions**: Shared serverless functions

### 3. Data Models
iOS Swift models mirror TypeScript interfaces:
- `TripV2` ↔ `TripV2` (TypeScript)
- `ActivityV2` ↔ `ActivityV2` (TypeScript)
- `User` ↔ `User` (TypeScript)

## Development Workflow

### 1. Local Development
```bash
# Start web API server (from frontend directory)
cd frontend
npm run dev

# Update iOS app config to use local API
# In Config.swift:
static let apiBaseURL = "http://localhost:3000/api"
```

### 2. Adding New Features
When adding features that need API support:
1. Add API endpoint in `/frontend/app/api/`
2. Update TypeScript interfaces in `/frontend/types/`
3. Update Swift models in `/ios-app/Sources/NovaTrekCore/Models/`
4. Implement service methods in both platforms

### 3. Firebase Rules
When adding new collections or changing data structure:
1. Update rules in `/firebase/firestore.rules`
2. Deploy with: `npm run deploy:rules`
3. Both web and iOS apps use the same rules

## Code Sharing Strategies

### 1. Model Synchronization
Consider using code generation tools:
- [Sourcery](https://github.com/krzysztofzablocki/Sourcery) for Swift codegen
- [quicktype](https://quicktype.io) for TypeScript → Swift conversion

### 2. Business Logic
- Core algorithms can be implemented in both TypeScript and Swift
- Consider extracting complex logic to Firebase Functions

### 3. Assets and Resources
- Share image assets through Firebase Storage
- Use consistent naming conventions across platforms

## Testing

### 1. API Testing
- Use the same test data for both platforms
- Ensure API changes are backward compatible
- Test offline scenarios on iOS

### 2. Integration Testing
- Test user flows across web and mobile
- Verify data synchronization
- Test push notifications from web actions

## Deployment

### 1. Versioning
- Keep iOS app version in sync with web app major versions
- Use semantic versioning: MAJOR.MINOR.PATCH

### 2. Release Process
1. Deploy web app updates first
2. Ensure API backward compatibility
3. Submit iOS app to App Store
4. Coordinate feature launches

### 3. Environment Configuration
- Production: Uses production API and Firebase
- Staging: Uses staging environment
- Development: Can use local or staging

## Common Patterns

### 1. Authentication Flow
```swift
// iOS
Auth.auth().signIn(withEmail: email, password: password)

// Web (TypeScript)
signInWithEmailAndPassword(auth, email, password)
```

### 2. Real-time Updates
```swift
// iOS
db.collection("trips-v2")
  .addSnapshotListener { snapshot, error in
    // Handle updates
  }

// Web (TypeScript)
onSnapshot(collection(db, "trips-v2"), (snapshot) => {
  // Handle updates
})
```

### 3. API Calls
```swift
// iOS
let trip = try await api.request("/trips-v2/\(tripId)")

// Web (TypeScript)
const trip = await fetch(`/api/trips-v2/${tripId}`)
```

## Troubleshooting

### Common Issues

1. **Model Mismatch**
   - Ensure Swift models match TypeScript interfaces
   - Check date formatting and timezone handling

2. **Authentication Errors**
   - Verify Firebase configuration matches
   - Check token expiration handling

3. **API Compatibility**
   - Always version API endpoints
   - Maintain backward compatibility

### Debug Tools

1. **Network Debugging**
   - Use Proxyman or Charles for API inspection
   - Enable verbose logging in development

2. **Firebase Debugging**
   - Use Firebase Console for real-time monitoring
   - Check security rules in Firebase Emulator

## Future Considerations

1. **Code Generation**
   - Automate model synchronization
   - Generate API client code from OpenAPI spec

2. **Shared Libraries**
   - Consider React Native for shared components
   - Evaluate Kotlin Multiplatform for business logic

3. **CI/CD Integration**
   - Automated testing across platforms
   - Coordinated deployment pipelines