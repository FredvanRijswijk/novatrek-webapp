# Xcode Setup Guide for NovaTrek Safari Extension

This guide walks you through creating the Xcode project for the NovaTrek Safari Extension with the bundle ID `app.novatrek.safari`.

## Prerequisites

- macOS 12.0 or later
- Xcode 14.0 or later
- Apple Developer Account (free or paid)
- Built extension files (run `npm run build:all` first)

## Step 1: Create New Xcode Project

1. Open Xcode
2. Select **Create New Project** (or File → New → Project)
3. Choose platform: **macOS**
4. Choose template: **Safari Extension App**
5. Click **Next**

## Step 2: Configure Project Settings

Fill in these exact values:

- **Product Name**: `Save to NovaTrek`
- **Team**: Select your Apple Developer team
- **Organization Name**: `NovaTrek`
- **Organization Identifier**: `app.novatrek`
- **Bundle Identifier**: Will auto-generate as `app.novatrek.Save-to-NovaTrek`
- **Language**: Swift
- **User Interface**: SwiftUI
- **Include Tests**: ✓ (optional)

Click **Next** and save the project.

## Step 3: Fix Bundle Identifiers

1. Select the project in the navigator
2. Select the main app target
3. Go to **Signing & Capabilities** tab
4. Change **Bundle Identifier** to: `app.novatrek.safari`

5. Select the Extension target (NovaTrek Safari Extension)
6. Change **Bundle Identifier** to: `app.novatrek.safari.Extension`

## Step 4: Update Info.plist Files

### Main App Info.plist:
1. Open `Info.plist` in the main app folder
2. Ensure these keys exist:
```xml
<key>CFBundleDisplayName</key>
<string>NovaTrek Safari</string>
<key>CFBundleName</key>
<string>NovaTrek Safari</string>
```

### Extension Info.plist:
1. Open the Extension's `Info.plist`
2. Add/Update:
```xml
<key>SFSafariWebExtensionBundleIdentifier</key>
<string>app.novatrek.safari.Extension</string>
```

## Step 5: Replace Extension Resources

1. In Xcode, locate `NovaTrek Safari Extension/Resources/`
2. Delete all files in this folder (manifest.json, background.js, etc.)
3. Copy all files from `safari-extension/dist/` into this Resources folder
4. Make sure Xcode recognizes all files (they should appear in the project navigator)

## Step 6: Configure App Capabilities

### For the Extension Target:
1. Select the Extension target
2. Go to **Signing & Capabilities**
3. Ensure **App Sandbox** is enabled with:
   - ✓ Outgoing Connections (Client)
   - ✓ Incoming Connections (Server) - for localhost development

## Step 7: Update Swift Code

### Main App - ContentView.swift:
Replace the default ContentView with:

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "safari")
                .font(.system(size: 80))
                .foregroundColor(.accentColor)
            
            Text("NovaTrek Safari Extension")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Save travel inspiration from any website")
                .font(.title3)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Divider()
                .padding(.vertical)
            
            VStack(alignment: .leading, spacing: 15) {
                Label("Click the extension icon in Safari's toolbar", systemImage: "1.circle.fill")
                Label("Right-click to save pages, links, or images", systemImage: "2.circle.fill")
                Label("Add notes and organize by trip", systemImage: "3.circle.fill")
            }
            .font(.body)
            
            Spacer()
            
            Button("Open Safari Extension Preferences") {
                if let url = URL(string: "x-apple.systempreferences:com.apple.Safari.Extensions") {
                    NSWorkspace.shared.open(url)
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(40)
        .frame(width: 500, height: 400)
    }
}
```

## Step 8: Test the Extension

1. Select your Mac as the build destination
2. Press **⌘R** to build and run
3. The NovaTrek Safari app will launch
4. Click "Open Safari Extension Preferences"
5. Enable the NovaTrek extension
6. Look for the extension icon in Safari's toolbar

## Step 9: App Icons

1. Open `Assets.xcassets` in the main app
2. Select `AppIcon`
3. Drag your app icon images to the appropriate sizes
4. Repeat for the Extension's Assets.xcassets

## Troubleshooting

### Extension Not Appearing
- Ensure Safari → Preferences → Extensions shows NovaTrek
- Check Console.app for any errors
- Verify bundle IDs match exactly

### Build Errors
- Clean build folder: **⇧⌘K**
- Delete derived data: **⌘,** → Locations → Derived Data arrow
- Restart Xcode

### Code Signing Issues
- Ensure you have a valid development team selected
- For distribution, you'll need a paid Apple Developer account

## Distribution

### TestFlight (Requires Paid Developer Account)
1. Archive the app: Product → Archive
2. In Organizer, click "Distribute App"
3. Choose "App Store Connect"
4. Follow the upload process

### Direct Distribution (Free Developer Account)
1. Archive the app: Product → Archive
2. In Organizer, click "Distribute App"
3. Choose "Copy App"
4. Share the .app file directly

## Important URLs

- Bundle ID: `app.novatrek.safari`
- Extension Bundle ID: `app.novatrek.safari.Extension`
- App Store URL (future): `https://apps.apple.com/app/novatrek-safari/[your-app-id]`

## Next Steps

1. Test the extension thoroughly
2. Add app icons and marketing materials
3. Write App Store description
4. Submit for review (if distributing via App Store)