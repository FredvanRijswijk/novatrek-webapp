#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 NovaTrek Safari Extension Build & Sync\n');

// Function to run a command and stream output
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}

async function buildAndSync() {
  try {
    // Step 1: Build the extension
    console.log('📦 Building extension...\n');
    await runCommand('npm', ['run', 'build']);
    
    console.log('\n');
    
    // Step 2: Generate icons (optional - will fail gracefully if ImageMagick not installed)
    console.log('🎨 Generating icons...\n');
    try {
      await runCommand('npm', ['run', 'icons']);
    } catch (error) {
      console.log('⚠️  Icon generation skipped (install ImageMagick to enable)\n');
    }
    
    // Step 3: Sync to Xcode
    console.log('📱 Syncing to Xcode project...\n');
    await runCommand('node', ['scripts/sync-to-xcode.js']);
    
    console.log('\n✨ Build and sync completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAndSync();