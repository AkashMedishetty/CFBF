const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate version hash based on build time and package version
const packageJson = require('../package.json');
const buildTime = new Date().toISOString();
const versionHash = crypto.createHash('md5').update(buildTime + packageJson.version).digest('hex').substring(0, 8);

console.log(`Building service worker with version: ${versionHash}`);

// Read the service worker template
const swPath = path.join(__dirname, '../public/service-worker.js');
const swContent = fs.readFileSync(swPath, 'utf8');

// Replace version placeholder with actual version
const versionedSwContent = swContent.replace(
  /const APP_VERSION = .*?;/,
  `const APP_VERSION = 'v${packageJson.version}-${versionHash}';`
);

// Write to build directory
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

fs.writeFileSync(path.join(buildDir, 'service-worker.js'), versionedSwContent);

// Update manifest with version
const manifestPath = path.join(__dirname, '../build/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.start_url = `/?source=pwa&v=${versionHash}`;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

console.log('Service worker build complete');