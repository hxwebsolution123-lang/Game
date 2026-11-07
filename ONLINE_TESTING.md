# HX Cards Play — Online testing deployment

This bundle is prepared for a **test deployment**, not public production use.

## Recommended test setup
- Node.js + Express + Socket.IO app: Render Web Service.
- MySQL: Railway MySQL service.
- Keep both services in the same nearby region where possible.

## 1. Publish the source to GitHub
Create a private GitHub repository and upload the contents of this folder (the `package.json` and `server.js` must be at the repository root). Do not upload `.env`, passwords, or database secrets.

## 2. Create the MySQL test database on Railway
Create a Railway project, add a MySQL database, and wait until it is running. In the MySQL service's Variables view, copy the connection values. For a Render-hosted app, enable Railway's public TCP proxy and use its public host and port. Do not expose database credentials in chat or commit them to GitHub.

## 3. Deploy the app on Render
Create a Render Web Service from the GitHub repository. Render can detect `render.yaml`; alternatively use:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Set these environment variables in Render (map the Railway public MySQL values):
- `NODE_ENV=production`
- `ADMIN_USERNAME` = a new admin username
- `ADMIN_PASSWORD` = a strong unique password
- `SESSION_SECRET` = random string of at least 32 characters
- `DB_HOST` = Railway public host
- `DB_PORT` = Railway public TCP port (not necessarily 3306)
- `DB_NAME` = Railway database name
- `DB_USER` = Railway database username
- `DB_PASSWORD` = Railway database password

Render provides `PORT`; do not hard-code it. The server binds to `0.0.0.0` and exposes `/health`.

## 4. Verify the online services
1. Open `https://YOUR-SERVICE.onrender.com/health`. Expected JSON: `{"ok":true,"app":"HX Cards Play"}`.
2. Open `/admin.html`, sign in, and change the global turn timer. Confirm the setting saves and remains after an app restart.
3. Open the game in four separate browser profiles/devices. Create a room, join from the other three, and verify each sees the same players and turn changes.
4. Test draw, discard, timeout, invalid SHOW, valid SHOW, disconnect and reconnect.
5. Check Render logs for `MySQL: connected` and no database errors. Confirm `hx_settings`, `hx_players`, and `hx_matches` are created in Railway.

## Important limitations
- The current game rooms and hands are held in process memory. Restarting/redeploying the app ends active games.
- Reconnection works only within the same running process and is not cross-device recovery.
- A single Render instance should be used for this test; do not scale to multiple instances because rooms are not shared between instances.
- A successful `/health` response proves the web process is reachable, not that multiplayer and MySQL are fully verified.
- Do not use real users or money during this test. Do not share secrets in ChatGPT.
