# Put Fractal Foundry online for free

Everything in this `web` folder is the complete website:
- `index.html`: the game
- `manifest.webmanifest`: makes it installable
- `sw.js`: lets it work offline
- `icons/`: app icons
- `privacy.html`: privacy policy page (add your email first)

Upload the whole folder to **one** of these free hosts.

## Option A: Netlify Drop (easiest, about 2 minutes)
1. Go to **app.netlify.com/drop**.
2. Drag the `web` folder onto the page.
3. Sign up for a free account when it asks, so the site doesn't expire.
4. You get a link like `https://something.netlify.app`. Under **Site configuration → Change site name**, you can rename it, for example to `fractal-foundry.netlify.app`.

To update later: open the site in Netlify, go to **Deploys**, and drag the `web` folder in again.

## Option B: GitHub Pages
1. Create a free GitHub account, then a new **public** repository, for example `fractal-foundry`.
2. Choose **Add file → Upload files**, drag in everything *inside* the `web` folder, then commit.
3. Go to **Settings → Pages → Branch: main, folder: / (root) → Save**.
4. After a minute, the game is live at `https://YOUR-NAME.github.io/fractal-foundry/`.

## Option C: itch.io (good for players finding the game)
1. Zip the *contents* of the `web` folder so that `index.html` sits at the top level of the zip.
2. On itch.io, choose **Upload new project → Kind: HTML**, upload the zip and tick **This file will be played in the browser**.
3. Turn on **Mobile friendly** and **Fullscreen button**.

Itch shows the game inside its own page frame, so "Add to Home Screen" works best from Option A or B. Itch is great for discovery, so you can use it alongside A or B.

## How players install it
- **Android (Chrome):** open the link, then tap **Install app** (or ⋮ → **Add to Home screen**).
- **iPhone / iPad (Safari):** open the link, tap **Share → Add to Home Screen**.
- **Computer (Chrome / Edge):** click the install icon in the address bar.

Once installed, it opens full screen with its own icon and works without internet.

## When you change the game
1. Edit `Desktop/fractal-foundry.html` as usual.
2. In the `fractal-foundry-app` folder, run `npm run sync`. This copies the game into `web/` (and into the phone apps).
3. In `web/sw.js`, change `ff-v1` to `ff-v2` (then `ff-v3`, and so on). This makes installed copies pick up the update.
4. Upload the `web` folder again.

To test locally first, run `npm run web` and open http://localhost:8080.

## Later: Google Play from this same website
Once the site is live, paste its URL into **pwabuilder.com** and choose **Package for stores → Android**. It builds a Play-ready package with no Android Studio needed. The Play Console fee of $25 still applies.
