#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs').promises;
const path = require('path');

async function build() {
  console.log('Building Safari extension...');

  // Clean dist directory
  await fs.rm(path.join(__dirname, '../dist'), { recursive: true, force: true });
  await fs.mkdir(path.join(__dirname, '../dist'), { recursive: true });

  // Build TypeScript files
  await esbuild.build({
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
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Copy static files
  await fs.copyFile(
    path.join(__dirname, '../src/manifest.json'), 
    path.join(__dirname, '../dist/manifest.json')
  );
  await fs.copyFile(
    path.join(__dirname, '../src/popup.html'), 
    path.join(__dirname, '../dist/popup.html')
  );
  await fs.copyFile(
    path.join(__dirname, '../src/popup.css'), 
    path.join(__dirname, '../dist/popup.css')
  );

  // Copy icons (we'll need to generate these)
  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    // For now, copy the SVG as a placeholder
    try {
      await fs.copyFile(
        path.join(__dirname, '../src/icons/icon.svg'), 
        path.join(__dirname, `../dist/icon-${size}.png`)
      );
    } catch (err) {
      console.warn(`Warning: Could not copy icon-${size}.png`);
    }
  }

  console.log('Safari extension build complete!');
  console.log('\nNext steps:');
  console.log('1. Generate PNG icons in the correct sizes');
  console.log('2. Open Xcode and create a new Safari Extension project');
  console.log('3. Copy the dist folder contents to the Xcode project');
  console.log('4. Build and run in Xcode');
}

build().catch(console.error);