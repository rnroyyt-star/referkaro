# ReferKro PWA setup

PWA support is integrated without changing the existing website design or other app features.

## Included behavior
- Profile always shows a **Download App** / **Open App** action. It remains visible after installation.
- When installation is detected, the action changes to **Open App**. In an installed standalone app it navigates to the app home; from a browser it opens the same-origin app URL in a new top-level tab so Android can hand it to the installed PWA when link capture is enabled.
- The floating install shortcut also remains available and changes its label based on installation state.
- The manifest declares separate standard and maskable 192x192 and 512x512 icons. Maskable artwork keeps the logo inside the safe area.
- Legacy icon URLs point to the canonical ReferKro icon artwork to avoid stale shortcut branding.
- Service worker precaches all four PWA icons, uses a bumped cache version, and does not cache API responses or user-specific HTML.

## Verify after deployment
Check these HTTPS URLs return HTTP 200 with the expected content types:
- `/manifest.json`
- `/sw.js`
- `/icons/icon-192.png` and `/icons/icon-512.png`
- `/icons/icon-192-maskable.png` and `/icons/icon-512-maskable.png`

On Android Chrome, install the app from the browser menu if needed. If Android does not hand an Open App link to the installed PWA, check Android Settings → Apps → ReferKro → Open by default / supported links; OS link-capture behavior varies by Android and browser version.
