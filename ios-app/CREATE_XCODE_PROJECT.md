# Creating the Xcode Project for NovaTrek iOS App

Since Xcode projects can't be created via command line, follow these steps to create the project:

## Step 1: Create New Xcode Project

1. Open Xcode
2. Choose **Create New Project** (or File → New → Project)
3. Select **iOS** → **App**
4. Click **Next**

## Step 2: Configure Project Settings

Fill in these values:
- **Product Name**: `NovaTrek`
- **Team**: Select your development team
- **Organization Name**: `NovaTrek`
- **Organization Identifier**: `app.novatrek`
- **Bundle Identifier**: Change to `app.novatrek.go`
- **Interface**: **SwiftUI**
- **Language**: **Swift**
- **Use Core Data**: ❌ (unchecked)
- **Include Tests**: ✅ (checked)

Save the project in the `ios-app` directory (replace the existing folder).

## Step 3: Add Swift Package Dependencies

1. Select the project in navigator
2. Select the NovaTrek target
3. Go to **General** tab → **Frameworks, Libraries, and Embedded Content**
4. Click **+** → **Add Package Dependency**
5. Add these packages:
   - `https://github.com/firebase/firebase-ios-sdk.git` (version 11.15.0+)
   - `https://github.com/Alamofire/Alamofire.git` (version 5.8.0+)
   - `https://github.com/onevcat/Kingfisher.git` (version 7.10.0+)

## Step 4: Integrate Existing Code

### Move Core Library:
1. Drag the `Sources/NovaTrekCore` folder into Xcode
2. Choose "Create groups" and ensure target membership is checked

### Replace Generated Files:
1. Delete the auto-generated `ContentView.swift` and `NovaTrekApp.swift`
2. Drag in our custom files from the `NovaTrek` folder:
   - `NovaTrekApp.swift`
   - `Views/TripListView.swift`

### Add Configuration:
1. Copy `Config.example.swift` to `Config.swift`
2. Add `Config.swift` to the project (make sure it's added to the target)
3. Update with your API endpoints

## Step 5: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your NovaTrek project
3. Click "Add app" → iOS
4. Enter bundle ID: `app.novatrek.go`
5. Download `GoogleService-Info.plist`
6. Drag it into Xcode (ensure it's added to the target)

## Step 6: Update Project Settings

### Deployment Target:
1. Select project → NovaTrek target → General
2. Set **Minimum Deployments** to iOS 16.0

### Capabilities:
1. Go to **Signing & Capabilities** tab
2. Click **+ Capability**
3. Add:
   - **Push Notifications**
   - **Background Modes** (check "Remote notifications")

### Info.plist:
Add these keys:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>NovaTrek uses your location to provide nearby activity recommendations and navigation.</string>

<key>NSCameraUsageDescription</key>
<string>NovaTrek needs camera access to capture travel memories and receipts.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>NovaTrek needs photo access to save and share your travel photos.</string>
```

## Step 7: Build and Run

1. Select your iPhone simulator or device
2. Press **⌘R** to build and run
3. If you see build errors:
   - Clean build folder: **⇧⌘K**
   - Resolve any missing dependencies
   - Ensure all Swift files are added to the target

## Alternative: Use Swift Package Manager Directly

If you prefer to work without an Xcode project initially:

```bash
# From ios-app directory
swift build
swift test
```

But you'll eventually need an Xcode project for:
- Running on iOS devices/simulators
- Configuring app capabilities
- Submitting to App Store
- Managing certificates and provisioning profiles

## Project Structure After Setup

```
ios-app/
├── NovaTrek.xcodeproj/          # Xcode project file
├── NovaTrek/                    # Main app folder
│   ├── NovaTrekApp.swift
│   ├── Config.swift
│   ├── GoogleService-Info.plist
│   ├── Info.plist
│   ├── Assets.xcassets/
│   └── Views/
│       └── TripListView.swift
├── Sources/
│   └── NovaTrekCore/           # Core library
│       ├── Models/
│       └── Services/
├── NovaTrekTests/
└── NovaTrekUITests/
```

## Next Steps

After creating the Xcode project:
1. Test basic functionality
2. Implement remaining views (Packing, Chat, Profile)
3. Set up push notification certificates
4. Test on a real device
5. Prepare for App Store submission