# Token Slot Machine

A lightweight browser-based slot machine for friendly game nights using in-game tokens.

## Project files (where the code is)
All source files are in this folder:

- `/workspace/Gambling-machine/index.html` — page structure (what you see on screen)
- `/workspace/Gambling-machine/styles.css` — visuals/theme/layout
- `/workspace/Gambling-machine/script.js` — game logic, balance, admin password, payouts
- `/workspace/Gambling-machine/README.md` — setup/use instructions

## Features
- Fixed 1-token spin cost.
- Probability table tuned for **93% RTP** (long-run), which equals a **7% house edge**.
- Password-protected admin dialog for adding tokens.
- Clean dark UI.
- Saves token balance in browser `localStorage`.

## Edit the code

### Option A: VS Code (recommended)
From a terminal:

```bash
cd /workspace/Gambling-machine
code .
```

Then edit:
- `script.js` for logic (password, payouts, behavior)
- `styles.css` for look and feel
- `index.html` for text/layout

### Option B: Any text editor
Open `/workspace/Gambling-machine` and edit the same files directly.

## Launch the game

### Quick launch (no server)
Open `index.html` directly in your browser.

From terminal:

```bash
cd /workspace/Gambling-machine
xdg-open index.html
```

If `xdg-open` is unavailable, just double-click `index.html` in your file browser.

## Configure
- Change the admin password in `script.js`:
  - `const ADMIN_PASSWORD = "changeme";`

## Notes
- This is a client-side demo. Anyone with browser dev tools can inspect the code/password.
- If you want stronger security, move admin auth and token updates to a backend service.
