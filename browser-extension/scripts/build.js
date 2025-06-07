const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Clean dist directory
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}
fs.mkdirSync(distPath);

// Copy static files
const staticFiles = [
  'src/manifest.json',
  'src/popup.html',
  'src/popup.css',
  'src/icons'
];

staticFiles.forEach(file => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(distPath, path.basename(file));
  
  if (fs.statSync(srcPath).isDirectory()) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
});

// Build TypeScript files
const buildOptions = {
  entryPoints: [
    'src/background.ts',
    'src/popup.ts',
    'src/content.ts'
  ],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'chrome91',
  sourcemap: process.env.NODE_ENV !== 'production',
};

const isWatch = process.argv.includes('--watch');

if (isWatch) {
  esbuild.context(buildOptions).then(async (ctx) => {
    await ctx.watch();
    console.log('Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}