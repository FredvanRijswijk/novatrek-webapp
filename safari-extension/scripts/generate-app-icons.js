#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// App icon sizes needed for macOS/iOS Safari Extension App
const APP_ICON_SIZES = [
  // iOS App Icons
  { size: 20, scale: 2, idiom: 'iphone', filename: '40.png' },
  { size: 20, scale: 3, idiom: 'iphone', filename: '60.png' },
  { size: 29, scale: 2, idiom: 'iphone', filename: '58.png' },
  { size: 29, scale: 3, idiom: 'iphone', filename: '87.png' },
  { size: 40, scale: 2, idiom: 'iphone', filename: '80.png' },
  { size: 40, scale: 3, idiom: 'iphone', filename: '120.png' },
  { size: 60, scale: 2, idiom: 'iphone', filename: '120-1.png' },
  { size: 60, scale: 3, idiom: 'iphone', filename: '180.png' },
  
  // iPad App Icons
  { size: 20, scale: 1, idiom: 'ipad', filename: '20.png' },
  { size: 20, scale: 2, idiom: 'ipad', filename: '40-1.png' },
  { size: 29, scale: 1, idiom: 'ipad', filename: '29.png' },
  { size: 29, scale: 2, idiom: 'ipad', filename: '58-1.png' },
  { size: 40, scale: 1, idiom: 'ipad', filename: '40-2.png' },
  { size: 40, scale: 2, idiom: 'ipad', filename: '80-1.png' },
  { size: 76, scale: 1, idiom: 'ipad', filename: '76.png' },
  { size: 76, scale: 2, idiom: 'ipad', filename: '152.png' },
  { size: 83.5, scale: 2, idiom: 'ipad', filename: '167.png' },
  
  // iOS Marketing
  { size: 1024, scale: 1, idiom: 'ios-marketing', filename: '1024.png' },
  
  // macOS App Icons
  { size: 16, scale: 1, idiom: 'mac', filename: 'mac-16.png' },
  { size: 16, scale: 2, idiom: 'mac', filename: 'mac-32.png' },
  { size: 32, scale: 1, idiom: 'mac', filename: 'mac-32-1.png' },
  { size: 32, scale: 2, idiom: 'mac', filename: 'mac-64.png' },
  { size: 128, scale: 1, idiom: 'mac', filename: 'mac-128.png' },
  { size: 128, scale: 2, idiom: 'mac', filename: 'mac-256.png' },
  { size: 256, scale: 1, idiom: 'mac', filename: 'mac-256-1.png' },
  { size: 256, scale: 2, idiom: 'mac', filename: 'mac-512.png' },
  { size: 512, scale: 1, idiom: 'mac', filename: 'mac-512-1.png' },
  { size: 512, scale: 2, idiom: 'mac', filename: 'mac-1024.png' },
];

async function generateAppIcons() {
  console.log('🎨 Generating App Icons for Xcode Assets.xcassets...\n');
  
  const svgPath = path.join(__dirname, '../src/icons/icon.svg');
  const xcodeProjectPath = path.join(__dirname, '../../SaveToNovaTrek');
  const appIconsetPath = path.join(xcodeProjectPath, 'Shared (App)/Assets.xcassets/AppIcon.appiconset');
  
  // Check if SVG exists
  try {
    await fs.access(svgPath);
  } catch (error) {
    console.error('❌ SVG icon not found at:', svgPath);
    process.exit(1);
  }
  
  // Check if ImageMagick is installed
  try {
    await execAsync('which convert');
  } catch (error) {
    console.error('❌ ImageMagick is not installed. Please install it first:');
    console.error('brew install imagemagick');
    process.exit(1);
  }
  
  // Create AppIcon.appiconset directory
  await fs.mkdir(appIconsetPath, { recursive: true });
  console.log('📁 Created AppIcon.appiconset directory');
  
  // Generate each icon size
  console.log('\n🔨 Generating icons...');
  for (const icon of APP_ICON_SIZES) {
    const actualSize = icon.size * icon.scale;
    const outputPath = path.join(appIconsetPath, icon.filename);
    
    const command = `convert -background none -resize ${actualSize}x${actualSize} "${svgPath}" "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`  ✓ Generated ${icon.filename} (${icon.size}x${icon.size}@${icon.scale}x)`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${icon.filename}:`, error.message);
    }
  }
  
  // Create Contents.json
  const contents = {
    images: APP_ICON_SIZES.map(icon => ({
      size: `${icon.size}x${icon.size}`,
      idiom: icon.idiom,
      filename: icon.filename,
      scale: `${icon.scale}x`
    })),
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  const contentsPath = path.join(appIconsetPath, 'Contents.json');
  await fs.writeFile(contentsPath, JSON.stringify(contents, null, 2));
  console.log('\n✓ Created Contents.json');
  
  // Also generate extension icons in the extension's Assets.xcassets
  const extensionIconsetPath = path.join(xcodeProjectPath, 'Shared (Extension)/Assets.xcassets/ExtensionIcon.appiconset');
  await fs.mkdir(extensionIconsetPath, { recursive: true });
  
  // Extension only needs a subset of icons
  const extensionSizes = [
    { size: 48, filename: 'extension-48.png' },
    { size: 96, filename: 'extension-96.png' },  // 48@2x
    { size: 128, filename: 'extension-128.png' },
    { size: 256, filename: 'extension-256.png' }, // 128@2x
  ];
  
  console.log('\n🔨 Generating extension icons...');
  for (const icon of extensionSizes) {
    const outputPath = path.join(extensionIconsetPath, icon.filename);
    const command = `convert -background none -resize ${icon.size}x${icon.size} "${svgPath}" "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`  ✓ Generated ${icon.filename}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${icon.filename}:`, error.message);
    }
  }
  
  // Create Contents.json for extension
  const extensionContents = {
    images: [
      { size: '48x48', idiom: 'mac', filename: 'extension-48.png', scale: '1x' },
      { size: '48x48', idiom: 'mac', filename: 'extension-96.png', scale: '2x' },
      { size: '64x64', idiom: 'mac', filename: 'extension-128.png', scale: '2x' },
    ],
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  const extensionContentsPath = path.join(extensionIconsetPath, 'Contents.json');
  await fs.writeFile(extensionContentsPath, JSON.stringify(extensionContents, null, 2));
  
  // Generate LargeIcon for macOS
  const largeIconPath = path.join(xcodeProjectPath, 'Shared (App)/Assets.xcassets/LargeIcon.imageset');
  await fs.mkdir(largeIconPath, { recursive: true });
  
  console.log('\n🔨 Generating LargeIcon...');
  const largeIconSizes = [
    { size: 512, filename: 'icon-512.png', scale: '1x' },
    { size: 1024, filename: 'icon-1024.png', scale: '2x' },
  ];
  
  for (const icon of largeIconSizes) {
    const outputPath = path.join(largeIconPath, icon.filename);
    const command = `convert -background none -resize ${icon.size}x${icon.size} "${svgPath}" "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`  ✓ Generated ${icon.filename}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${icon.filename}:`, error.message);
    }
  }
  
  // Create Contents.json for LargeIcon
  const largeIconContents = {
    images: [
      { filename: 'icon-512.png', idiom: 'universal', scale: '1x' },
      { filename: 'icon-1024.png', idiom: 'universal', scale: '2x' },
    ],
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  const largeIconContentsPath = path.join(largeIconPath, 'Contents.json');
  await fs.writeFile(largeIconContentsPath, JSON.stringify(largeIconContents, null, 2));
  
  console.log('\n✨ App icon generation complete!');
  console.log('\n📱 Generated:');
  console.log('  ✓ AppIcon.appiconset - Main app icons for iOS/macOS');
  console.log('  ✓ ExtensionIcon.appiconset - Safari extension icons');
  console.log('  ✓ LargeIcon.imageset - Large icon for macOS');
  console.log('\n📱 Next steps:');
  console.log('1. Open Xcode');
  console.log('2. The icons should appear automatically in Assets.xcassets');
  console.log('3. If not, clean build folder (Shift+Cmd+K) and rebuild');
}

generateAppIcons().catch(console.error);