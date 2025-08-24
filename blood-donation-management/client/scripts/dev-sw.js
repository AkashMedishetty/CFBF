const fs = require('fs');
const path = require('path');

// Copy development service worker to public directory
const srcPath = path.join(__dirname, '..', 'public', 'sw-dev.js');
const destPath = path.join(__dirname, '..', 'public', 'sw.js');

try {
  const swContent = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(destPath, swContent);
  console.log('✓ Development service worker copied to sw.js');
} catch (error) {
  console.error('✗ Failed to copy development service worker:', error.message);
  process.exit(1);
}

// Create development manifest and copy it as manifest.json for development
const manifestSrcPath = path.join(__dirname, '..', 'public', 'manifest.json');
const manifestDevPath = path.join(__dirname, '..', 'public', 'manifest-dev.json');
const manifestDestPath = path.join(__dirname, '..', 'public', 'manifest.json');

try {
  // First, backup the original manifest if it doesn't have a backup
  const manifestBackupPath = path.join(__dirname, '..', 'public', 'manifest-original.json');
  if (!fs.existsSync(manifestBackupPath)) {
    const originalContent = fs.readFileSync(manifestSrcPath, 'utf8');
    fs.writeFileSync(manifestBackupPath, originalContent);
    console.log('✓ Original manifest backed up as manifest-original.json');
  }
  
  // Read the original manifest
  const manifestContent = fs.readFileSync(manifestBackupPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  // Create a simple base64 icon for development
  const base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAwCAYAAABtG3WwAAAACXBIWXMAAAsSAAALEgHS3X78AAAAGXRFWHRTb2Z0d2FyZQBQbGFjZWhvbGRlciBQTkcgdjEAAABYSURBVHicY2AYBaOBlYGBgYGJgQGJmYGBgQGxgZGBwT8GJgZGBkYmBgYGBkYGBgYGJ4Z8DAwMDw9E0EwMDQ0NDg8MDAwMDw8DAwMDw4GBAUKYwQw0AAACUdQ8/65o5gAAAAASUVORK5CYII=';
  
  // Update manifest for development
  manifest.start_url = '/?source=pwa&dev=true';
  manifest.icons = [{
    src: base64Icon,
    type: 'image/png',
    sizes: '192x192',
    purpose: 'any'
  }];
  
  // Save development manifest
  fs.writeFileSync(manifestDevPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Development manifest created as manifest-dev.json');
  
  // Replace the main manifest.json with development version
  fs.writeFileSync(manifestDestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Development manifest copied to manifest.json for development mode');
} catch (error) {
  console.error('✗ Failed to create development manifest:', error.message);
  process.exit(1);
}