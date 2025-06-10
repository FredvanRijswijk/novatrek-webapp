#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function generateIcons() {
  console.log('Generating Safari extension icons...');
  
  const sizes = [16, 32, 48, 128];
  const svgPath = path.join(__dirname, '../src/icons/icon.svg');
  const distPath = path.join(__dirname, '../dist');
  
  // Ensure dist directory exists
  await fs.mkdir(distPath, { recursive: true });
  
  // Check if ImageMagick is installed
  try {
    await execAsync('which convert');
  } catch (error) {
    console.error('ImageMagick is not installed. Please install it first:');
    console.error('brew install imagemagick');
    process.exit(1);
  }
  
  // Generate each icon size
  for (const size of sizes) {
    const outputPath = path.join(distPath, `icon-${size}.png`);
    const command = `convert -background none -resize ${size}x${size} "${svgPath}" "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`✓ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`Failed to generate ${size}x${size} icon:`, error);
    }
  }
  
  // Also copy for @2x versions (Retina display)
  const retinaMap = {
    16: 32,
    32: 64,
    48: 96,
    128: 256
  };
  
  for (const [base, retina] of Object.entries(retinaMap)) {
    const outputPath = path.join(distPath, `icon-${base}@2x.png`);
    const command = `convert -background none -resize ${retina}x${retina} "${svgPath}" "${outputPath}"`;
    
    try {
      await execAsync(command);
      console.log(`✓ Generated ${base}@2x icon`);
    } catch (error) {
      console.error(`Failed to generate ${base}@2x icon:`, error);
    }
  }
  
  console.log('\n✨ Icon generation complete!');
}

generateIcons().catch(console.error);