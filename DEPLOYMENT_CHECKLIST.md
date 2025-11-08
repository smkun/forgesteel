# Forgesteel Backend Deployment Checklist

## Files to Upload to Server

After running `npm run server:build`, upload these files to `/home/gamers/nodejs/forgesteel-api/`:

### 1. Core Server Files
```
server/dist/server/   → /home/gamers/nodejs/forgesteel-api/server/
app.js                → /home/gamers/nodejs/forgesteel-api/app.js
package.json          → /home/gamers/nodejs/forgesteel-api/package.json (backend version)
```

### 2. Environment File
```
.env → /home/gamers/nodejs/forgesteel-api/.env
```

**CRITICAL**: The `.env` file must be in the app root directory (`/home/gamers/nodejs/forgesteel-api/.env`), NOT inside the server/ subdirectory.

### 3. After Upload - Run in cPanel Terminal
```bash
cd /home/gamers/nodejs/forgesteel-api
npm install
```

## Current Fix: Environment Loading

The latest build includes enhanced `.env` file detection that will:
1. Check `process.cwd()` (current working directory) first
2. Try relative paths from the module directory
3. Log the search process to help diagnose issues

When the server starts, you should now see logs like:
```
[ENV] Current working directory: /home/gamers/nodejs/forgesteel-api
[ENV] Module directory: /home/gamers/nodejs/forgesteel-api/server/utils
[ENV] Loading environment from: /home/gamers/nodejs/forgesteel-api/.env
[ENV] File exists: true
```

## Deployment Structure

Your server directory structure should be:
```
/home/gamers/nodejs/forgesteel-api/
├── .env                          # Environment variables (MUST BE HERE)
├── app.js                        # Passenger entry point
├── package.json                  # Backend dependencies only
├── node_modules/                 # Installed after npm install
├── server/
│   ├── data/
│   │   ├── characters.repository.js
│   │   └── db-connection.js
│   ├── logic/
│   │   ├── auth.logic.js
│   │   └── character.logic.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── character.routes.js
│   │   └── auth.routes.js
│   ├── utils/
│   │   └── loadEnv.js           # Updated with enhanced .env detection
│   └── index.js                 # Main server file
```

## Expected Logs on Successful Start

```
[BOOT] Starting Forgesteel API...
[BOOT] Environment: Passenger (iFastNet)
[BOOT] Node version: v20.19.4
[BOOT] PASSENGER_BASE_URI: /forgesteel
[BOOT] PASSENGER_APP_ENV: production
[ENV] Current working directory: /home/gamers/nodejs/forgesteel-api
[ENV] Module directory: /home/gamers/nodejs/forgesteel-api/server/utils
[ENV] Loading environment from: /home/gamers/nodejs/forgesteel-api/.env
[ENV] File exists: true
[AUTH] ✅ Firebase Admin SDK initialized
[AUTH] Project: forgesteel-6e968
[DB] ✅ Connected to MySQL database: gamers_forgesteel
[SERVER] ✅ API server initialized
```

## If Firebase Still Fails

If you still see `Expected path: undefined`, check:

1. **File Location**: Run in cPanel terminal:
   ```bash
   cd /home/gamers/nodejs/forgesteel-api
   ls -la .env
   cat .env | grep GOOGLE_APPLICATION_CREDENTIALS
   ```

2. **File Permissions**: Ensure .env is readable:
   ```bash
   chmod 644 .env
   ```

3. **Line Endings**: If edited on Windows, convert to Unix:
   ```bash
   dos2unix .env
   ```

4. **Check Logs**: The new diagnostic logs will show exactly where it's looking for the file.

## Next Steps After This Deploy

1. Upload the new compiled `server/dist/server/` directory
2. Restart the app in cPanel (or it will auto-restart)
3. Check `/home/gamers/logs/forgesteel-passenger.log` for the new diagnostic output
4. Verify the `[ENV]` logs show the correct paths

## Frontend Deployment

The frontend `.env` file should have:
```bash
VITE_API_BASE_URL=https://32gamers.com/forgesteel
```

**NOT** `https://32gamers.com/forgesteel/api` (this causes double `/api/` in URLs)
