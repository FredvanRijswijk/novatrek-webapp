# NovaTrek Safari Extension

A Safari web extension that allows users to save travel-related content from any website directly to their NovaTrek travel inbox.

## Features

- **Context Menu Integration**: Right-click to save pages, text selections, links, or images
- **Floating Save Button**: Automatically appears on travel-related websites
- **Popup Interface**: Add notes, tags, and assign to trips
- **Quick Save**: One-click saving without additional metadata
- **Smart Detection**: Automatically detects travel-related content

## Development Setup

### Prerequisites

- macOS 12.0 or later
- Xcode 14.0 or later
- Safari 16.0 or later
- Node.js 16+ and npm

### Building the Extension

1. Install dependencies:
```bash
cd safari-extension
npm install
```

2. Build the extension:
```bash
npm run build
```

This creates a `dist` folder with the compiled extension files.

### Creating the Xcode Project

1. Open Xcode and create a new project
2. Choose **macOS** → **Safari Extension App**
3. Fill in the details:
   - Product Name: `NovaTrek Travel Saver`
   - Team: Select your development team
   - Organization Identifier: `app.novatrek`
   - Bundle Identifier: `app.novatrek.safari`
   - Language: Swift
   - Include Safari Web Extension: ✓ (checked)

4. When prompted for the extension type, select **Safari Web Extension**

### Integrating the Web Extension

1. In Xcode, delete the default extension files in the `Shared (Extension)/Resources` folder
2. Copy all files from `safari-extension/dist/` to `Shared (Extension)/Resources/`
3. Update `Info.plist` in the extension target:
   - Set `SFSafariWebExtensionBundleIdentifier` to `app.novatrek.safari.Extension`

### Configuring Entitlements

1. In the extension target's **Signing & Capabilities**:
   - Add **App Sandbox** capability
   - Under App Sandbox, enable:
     - ✓ Outgoing Connections (Client)
     - ✓ Incoming Connections (Server) - if needed for local development

2. Update the extension's `entitlements` file to include:
```xml
<key>com.apple.security.app-sandbox</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
```

### Building and Running

1. Select your Mac as the build target
2. Build and run the project (⌘R)
3. The containing app will launch
4. Click "Open in Safari Extensions Preferences"
5. Enable the NovaTrek extension in Safari

### Testing

1. Navigate to any website
2. Look for the extension icon in Safari's toolbar
3. Test the context menu by right-clicking on various elements
4. Visit travel-related websites to see the floating save button

### Distribution

#### TestFlight Distribution
1. Archive the app (Product → Archive)
2. Upload to App Store Connect
3. Distribute via TestFlight

#### Mac App Store Distribution
1. Ensure all App Store requirements are met
2. Submit for review through App Store Connect

## Differences from Chrome Extension

### API Differences
- Safari uses `browser.*` APIs instead of `chrome.*` APIs
- The extension adapter in our code handles this automatically

### Icon Requirements
- Safari requires PNG icons (not SVG)
- Required sizes: 16x16, 32x32, 48x48, 128x128
- Icons must be included in the Resources folder

### Permissions
- Safari's permission model is more restrictive
- Users must explicitly grant permissions in Safari preferences

### Background Scripts
- Safari may suspend background scripts more aggressively
- Important tasks should complete quickly

## Troubleshooting

### Extension Not Appearing
1. Check Safari → Preferences → Extensions
2. Ensure the extension is enabled
3. Check the extension is properly signed

### API Calls Failing
1. Verify the host permissions in manifest.json
2. Check Safari's Web Inspector for the extension
3. Ensure CORS is properly configured on the backend

### Building Issues
1. Clean the build folder (Shift+⌘K)
2. Delete derived data
3. Ensure Node.js build completes successfully

## Icon Generation

To generate the required PNG icons from the SVG:

```bash
# Install dependencies
npm install -g sharp-cli

# Generate icons (example using ImageMagick)
convert -background none -resize 16x16 src/icons/icon.svg dist/icon-16.png
convert -background none -resize 32x32 src/icons/icon.svg dist/icon-32.png
convert -background none -resize 48x48 src/icons/icon.svg dist/icon-48.png
convert -background none -resize 128x128 src/icons/icon.svg dist/icon-128.png
```

## Development Tips

1. Use Safari's Web Inspector to debug:
   - Develop → Web Extension Background Content → NovaTrek
   
2. Test on different macOS versions if possible

3. Monitor memory usage - Safari is strict about resource consumption

4. Test with Safari's Intelligent Tracking Prevention enabled

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Email: support@novatrek.app