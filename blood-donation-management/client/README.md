# PWA & Offline Support

This client is a Progressive Web App with offline caching, versioned cache busting, and auto-refresh on updates.

## How it works

- `public/service-worker.js` implements:
  - Versioned caches named `cfb-cache-<version>`
  - Network-first strategy for HTML (navigation)
  - Stale-while-revalidate strategy for static assets
  - Old cache cleanup during activation
  - Auto-activation and client claim for instant updates

- `src/index.js` registers the service worker and dispatches a `pwa:update-available` event when new content is ready. `src/App.js` listens to this event and reloads the app (you can swap to a confirmation UI if desired).

## iOS and Android PWA

- `public/index.html` includes iOS meta tags and `apple-touch-icon` for iOS installability.
- `public/manifest.json` defines name, icons (maskable), display, scope, shortcuts.

## Bumping the cache

Update the `APP_VERSION` string at the top of `public/service-worker.js` to force cache busting and immediate refresh on next visit.


