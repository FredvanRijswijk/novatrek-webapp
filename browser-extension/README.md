# NovaTrek Browser Extension

Save travel inspiration from anywhere on the web directly to your NovaTrek travel inbox.

## Features

- **Right-click to save** - Save any page, link, image, or selected text
- **Smart detection** - Automatically detects travel content and shows save button
- **Quick save** - One-click save without opening popup
- **Add notes & tags** - Organize your saves with additional context
- **Assign to trips** - Add directly to existing trips or save for later

## Development

### Setup
```bash
cd browser-extension
npm install
```

### Build
```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Package for Chrome Web Store
npm run package
```

### Install in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## How it Works

### Architecture
- **Manifest V3** - Using the latest Chrome extension standard
- **Background Service Worker** - Handles context menus and API calls
- **Content Script** - Detects travel content and adds floating save button
- **Popup** - Main UI for saving with notes and tags

### Authentication
The extension uses token-based auth:
1. User clicks login in popup
2. Opens NovaTrek with special `/extension-auth` route
3. NovaTrek passes auth token back to extension
4. Token stored in `chrome.storage.local`

### API Integration
All saves go through the main NovaTrek API:
```
POST /api/captures
Authorization: Bearer <token>
```

## TODO

- [ ] Generate PNG icons from SVG (16, 32, 48, 128px)
- [ ] Add Firefox support (minor manifest changes)
- [ ] Implement smart content extraction
- [ ] Add keyboard shortcuts
- [ ] Offline queue for saves
- [ ] Better error handling and retry logic
- [ ] Options page for settings
- [ ] Badge counter for unsorted items

## Publishing

### Chrome Web Store
1. Create developer account ($5 one-time fee)
2. Prepare assets:
   - Screenshots (1280x800 or 640x400)
   - Promotional images
   - Privacy policy
3. Upload `novatrek-extension.zip`
4. Submit for review

### Firefox Add-ons
1. Create Mozilla developer account (free)
2. Minor manifest adjustments for Firefox
3. Submit for review

## Privacy

The extension only:
- Reads current tab URL and title
- Sends data to user's own NovaTrek account
- Stores auth token locally
- No tracking or analytics