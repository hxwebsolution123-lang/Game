# HX Cards Play — Phase 4 (stability fixes)

Premium 4-player rummy-style multiplayer game built with HTML/CSS/JavaScript, Node.js, Express, Socket.IO and MySQL.

## Game rules included
- Maximum 4 players per room; 9 cards per player.
- A valid declaration requires 2 disjoint pairs + one 4-card same-suit sequence; the ninth card is unused.
- A generated Joker can pair with any one card, regardless of rank.
- Joker is not wild in a sequence: its actual suit and rank must fit naturally.
- A-2-3-4 and J-Q-K-A sequences are supported.
- Players can drag/rearrange their hand locally at any time; arranging cards does not consume a turn.

## Phase 4 fixes
- Removed the non-functional room-host timer control. Only the authenticated admin dashboard changes the global timer.
- Admin timer changes are saved to MySQL before being applied to active rooms; if MySQL is unavailable, the API reports that the setting cannot be saved.
- Admin login now requires a strong `SESSION_SECRET` (at least 32 characters) and has a basic per-IP failed-login limit.
- Timer display now formats durations above 59 seconds correctly as `MM:SS`.
- When the main deck is empty, the discard pile is reshuffled while preserving its top card.
- Expanded automated tests for deck uniqueness, shuffle integrity and Joker pairing.

## Setup
1. Use Node.js 20 or newer.
2. Extract the ZIP and run `npm install`.
3. Create an empty MySQL database, e.g. `hx_cards_play`.
4. Copy `.env.example` to `.env` and fill in DB credentials, `ADMIN_USERNAME`, a strong `ADMIN_PASSWORD`, and a random `SESSION_SECRET` with at least 32 characters.
5. Run `npm start`.
6. Open `/` for the game and `/admin.html` for the admin dashboard.

The app creates `hx_settings`, `hx_players`, and `hx_matches` automatically. The admin timer setting requires MySQL. Without MySQL the server can start in memory-only mode, but the admin timer cannot be saved.

## Verification
Run:
- `npm test`
- `node --check server.js`
- `node --check db.js`
- `node --check public/app.js`
- `node --check public/admin.js`

## Not production-ready yet
- Active rooms/hands are still held in server memory. Restarting the process ends active matches.
- Reconnection is limited to 60 seconds on the same server process and uses the same browser's saved token; cross-device recovery is not implemented.
- Multi-device Socket.IO integration, real MySQL connectivity and load testing still need to be run in an environment with dependencies and a database available.
- Configure HTTPS, database backups, rate limiting at the proxy, abuse protection and a persistent Socket.IO adapter before scaling to multiple instances.
- Never publish `.env` or share your admin password.
