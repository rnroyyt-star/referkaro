# ReferKro PWA setup

This package adds installable-PWA support to the existing ReferKro Node.js app.

## Included changes
- `manifest.json` with ReferKro app metadata
- `sw.js` with a service worker that does not cache `/api/` responses or user-specific HTML
- `icons/icon-192.png` and `icons/icon-512.png`
- `index.html` links to the manifest and registers the service worker on HTTPS
- `server.js` serves the manifest, service worker, and icons with suitable content types and cache headers

## Deploy notes
1. Back up the current deployed code and data before replacing files.
2. Deploy the whole project using the same hosting/start command and environment variables as before.
3. Confirm these URLs return successfully on the live HTTPS domain:
   - `/manifest.json`
   - `/sw.js`
   - `/icons/icon-192.png`
   - `/icons/icon-512.png`
4. Open the website in Chrome on Android and use the browser menu's **Install app** or **Add to Home screen** option if offered.

The service worker intentionally does not cache API responses or the main page, to avoid showing stale account/wallet data. This means offline access is not provided. Updates appear from the live website after deployment and a normal service-worker refresh cycle; they are not guaranteed to appear instantly. The hosting platform must serve the same deployed code on the live domain.
