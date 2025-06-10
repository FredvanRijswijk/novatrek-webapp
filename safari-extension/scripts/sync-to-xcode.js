#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
// You can update this if you rename your Xcode project
const XCODE_PROJECT_NAME = process.env.XCODE_PROJECT_NAME || 'SaveToNovaTrek';
// Updated path to match Xcode's structure: "Shared (Extension)/Resources"
// Go up two levels from scripts directory to reach monorepo root
const EXTENSION_RESOURCES_PATH = `../../${XCODE_PROJECT_NAME}/Shared (Extension)/Resources`;

async function syncToXcode() {
  console.log('🔄 Syncing Safari extension to Xcode project...\n');

  // Check if Xcode project exists
  const xcodeProjectPath = path.join(__dirname, '../../', XCODE_PROJECT_NAME);
  try {
    await fs.access(xcodeProjectPath);
  } catch (error) {
    console.error(`❌ Xcode project not found at: ${xcodeProjectPath}`);
    console.error('\nPlease create the Xcode project first:');
    console.error('1. Open Xcode');
    console.error('2. Create new Safari Extension App');
    console.error(`3. Save as "${XCODE_PROJECT_NAME}" in the monorepo root`);
    process.exit(1);
  }

  // Check if dist folder exists
  const distPath = path.join(__dirname, '../dist');
  try {
    await fs.access(distPath);
  } catch (error) {
    console.error('❌ No dist folder found. Build the extension first:');
    console.error('npm run build');
    process.exit(1);
  }

  // Get the resources path
  const resourcesPath = path.join(__dirname, EXTENSION_RESOURCES_PATH);
  console.log('📍 Target path:', resourcesPath);
  
  try {
    // Create Resources directory if it doesn't exist
    await fs.mkdir(resourcesPath, { recursive: true });
    
    // Clean ALL existing files in Resources folder
    console.log('🧹 Cleaning ALL files in Resources folder...');
    const existingFiles = await fs.readdir(resourcesPath);
    
    for (const file of existingFiles) {
      const filePath = path.join(resourcesPath, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
        console.log(`  ✓ Removed ${file}`);
      }
    }

    // Copy all files from dist to Xcode resources
    console.log('📁 Copying files to Xcode project...');
    const filesToCopy = await fs.readdir(distPath);
    
    for (const file of filesToCopy) {
      const srcPath = path.join(distPath, file);
      const destPath = path.join(resourcesPath, file);
      
      const stat = await fs.stat(srcPath);
      if (stat.isDirectory()) {
        // Recursively copy directory
        await copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
        console.log(`  ✓ Copied ${file}`);
      }
    }

    console.log('\n✅ Sync completed successfully!');
    console.log('\n📱 Next steps:');
    console.log('1. Open Xcode');
    console.log('2. Build and run the project (⌘R)');
    console.log('3. Test the extension in Safari');

  } catch (error) {
    console.error('❌ Error syncing to Xcode:', error.message);
    process.exit(1);
  }
}

// Helper function to recursively copy directories
async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run the sync
syncToXcode().catch(console.error);