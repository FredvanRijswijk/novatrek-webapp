# Safari Extension Development Workflow

This guide explains the complete workflow for developing the NovaTrek Safari Extension.

## Project Structure

```
NovaTrek/web-app/              # Monorepo root
├── safari-extension/          # Web extension source
│   ├── src/                  # TypeScript source files
│   ├── dist/                 # Built files (gitignored)
│   └── scripts/              # Build scripts
└── NovaTrekSafari/           # Xcode project
    └── NovaTrekSafariExtension/Resources/  # Extension files
```

## Initial Setup

1. **Install dependencies**
   ```bash
   cd safari-extension
   npm install
   ```

2. **Create Xcode Project**
   - Follow `XCODE_SETUP.md` to create the Xcode project
   - Save it as `NovaTrekSafari` in the monorepo root

3. **First Build**
   ```bash
   npm run build:sync
   ```

## Development Commands

### Quick Start
```bash
npm run dev      # Build, sync, and watch for changes
```

### Individual Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the extension |
| `npm run sync` | Copy built files to Xcode |
| `npm run build:sync` | Build and sync in one command |
| `npm run watch` | Watch for changes and auto-sync |
| `npm run icons` | Generate PNG icons from SVG |
| `npm run clean` | Remove built files |

## Development Workflow

### 1. Regular Development
```bash
# Terminal 1: Start watch mode
cd safari-extension
npm run watch

# Terminal 2: Run Xcode
# Open NovaTrekSafari.xcodeproj
# Press ⌘R to run
```

### 2. Making Changes
1. Edit files in `safari-extension/src/`
2. Watch script automatically:
   - Rebuilds the extension
   - Syncs to Xcode project
3. In Safari: Reload the extension
   - Safari → Preferences → Extensions
   - Click reload button

### 3. Testing Changes
- **Quick test**: Reload extension in Safari
- **Full test**: Stop and restart from Xcode (⌘R)

## Build for Distribution

1. **Production Build**
   ```bash
   npm run clean
   npm run build:all
   npm run sync
   ```

2. **In Xcode**
   - Product → Archive
   - Follow distribution steps

## File Sync Details

The sync script automatically:
- Cleans old files from Xcode Resources
- Copies all files from `dist/` to Xcode
- Preserves Xcode project structure

## Debugging

### Safari Web Inspector
1. Safari → Preferences → Advanced
2. Enable "Show Develop menu in menu bar"
3. Develop → Web Extension Background Content → NovaTrek

### Console Logs
- Background script: Web Inspector → Console
- Content script: Inspect the webpage → Console
- Popup: Right-click popup → Inspect Element

### Common Issues

**Extension not updating?**
1. Hard reload: Safari → Develop → Empty Caches
2. Disable/re-enable extension
3. Restart Safari

**Build errors?**
```bash
npm run clean
npm run build:sync
```

**Xcode not finding files?**
- Check files appear in Xcode's project navigator
- Clean build folder: ⇧⌘K

## Git Workflow

### What to Commit
✅ Commit:
- `safari-extension/src/*`
- `safari-extension/scripts/*`
- `safari-extension/package.json`
- `NovaTrekSafari/*` (except build artifacts)

❌ Don't commit:
- `safari-extension/dist/`
- `safari-extension/node_modules/`
- `NovaTrekSafari/build/`
- `*.xcuserstate`

### Example .gitignore
```gitignore
# Safari Extension
safari-extension/dist/
safari-extension/node_modules/

# Xcode
NovaTrekSafari/build/
NovaTrekSafari/DerivedData/
*.xcuserstate
*.xcworkspace/xcuserdata/
```

## Tips

1. **Fast Iteration**
   - Use `npm run watch` for quick development
   - Only restart Xcode when necessary

2. **Icon Generation**
   - Install ImageMagick: `brew install imagemagick`
   - Run `npm run icons` after updating SVG

3. **Multiple Safari Profiles**
   - Create a development Safari profile
   - Keep extensions separate from personal browsing

4. **Version Bumping**
   - Update version in `package.json`
   - Update version in Xcode project settings
   - Keep them in sync