#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

let syncProcess = null;

async function syncToXcode() {
  // Kill previous sync if still running
  if (syncProcess) {
    syncProcess.kill();
  }

  console.log('\n🔄 Syncing to Xcode...');
  
  syncProcess = spawn('node', [path.join(__dirname, 'sync-to-xcode.js')], {
    stdio: 'inherit'
  });

  syncProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Sync complete! Reload the extension in Safari to see changes.\n');
    }
    syncProcess = null;
  });
}

async function build() {
  console.log('👀 Watching for changes...\n');

  const context = await esbuild.context({
    entryPoints: [
      path.join(__dirname, '../src/background.ts'),
      path.join(__dirname, '../src/content.ts'),
      path.join(__dirname, '../src/popup.ts')
    ],
    bundle: true,
    outdir: path.join(__dirname, '../dist'),
    format: 'esm',
    target: 'safari16',
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"development"'
    }
  });

  // Copy static files initially
  async function copyStaticFiles() {
    const srcDir = path.join(__dirname, '../src');
    const distDir = path.join(__dirname, '../dist');

    // Ensure dist directory exists
    await fs.mkdir(distDir, { recursive: true });

    // Copy manifest.json
    await fs.copyFile(
      path.join(srcDir, 'manifest.json'),
      path.join(distDir, 'manifest.json')
    );

    // Copy HTML and CSS files
    await fs.copyFile(
      path.join(srcDir, 'popup.html'),
      path.join(distDir, 'popup.html')
    );
    
    await fs.copyFile(
      path.join(srcDir, 'popup.css'),
      path.join(distDir, 'popup.css')
    );

    console.log('📁 Copied static files');
  }

  // Initial build
  await copyStaticFiles();
  await context.rebuild();
  await syncToXcode();

  // Watch for changes
  await context.watch();

  // Watch static files
  const watcher = fs.watch(path.join(__dirname, '../src'), { recursive: true });
  
  for await (const event of watcher) {
    if (event.filename) {
      if (event.filename.endsWith('.html') || 
          event.filename.endsWith('.css') || 
          event.filename.endsWith('.json')) {
        console.log(`📝 ${event.filename} changed`);
        await copyStaticFiles();
        await syncToXcode();
      }
    }
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Stopping watch mode...');
  if (syncProcess) {
    syncProcess.kill();
  }
  process.exit(0);
});

build().catch((error) => {
  console.error('❌ Watch error:', error);
  process.exit(1);
});