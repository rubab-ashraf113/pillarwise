# Pillarwise v1.0.0

Check the five pillars of your digital security: confidentiality, integrity, availability, authenticity and non-repudiation.
Everything runs in the browser. Nothing is uploaded. No accounts, ads or tracking.

**Live app:** https://rubab-ashraf113.github.io/pillarwise/

Created by Rubab Ashraf. Released under the MIT License.

## Use it offline on a computer
Unzip, then open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

## Publish it so anyone can install it (free, GitHub Pages)
1. Create a free account at github.com and a new public repository named `pillarwise`.
2. Click "Add file" > "Upload files" and upload everything in this folder (keep the `icons` folder).
3. Go to Settings > Pages. Under "Branch" choose `main` and `/ (root)`, then Save.
4. After about a minute your app is live at `https://YOUR-USERNAME.github.io/pillarwise/`.
5. Share that link. On Android or desktop Chrome people tap "Install app"; on iPhone/iPad, Share > "Add to Home Screen".

Any static host works the same way (Netlify, Cloudflare Pages, a university server). HTTPS is required for installing and offline use.

## Security
- Strict Content-Security-Policy: no inline scripts, no third-party code, network access only to itself and the optional
  Have I Been Pwned range API (k-anonymity: only 5 hash characters are sent).
- Service worker caches only the app's own files and never caches the breach API.
- Signing-key backups are encrypted with AES-256-GCM (PBKDF2-SHA-256, 600,000 iterations).
- "Erase my data" removes everything the app stored on the device.

## Verify your download
Compare the SHA-256 checksums in `SHA256SUMS.txt` with your files, for example with the app's own
Integrity > "File and text fingerprint" tool, or `sha256sum -c SHA256SUMS.txt` on Linux/macOS.
