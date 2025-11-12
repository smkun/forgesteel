# Production Deployment Checklist

**Issue**: `/api/campaigns` endpoint returning 404 in production after successful local build

## Diagnosis

Based on error logs:
```
Failed to load resource: the server responded with a status of 503 ()
Failed to load resource: the server responded with a status of 404 ()
Failed to load campaigns: ApiError: Route GET /api/campaigns not found
```

**503 Error**: Service Worker not loading (service unavailable)
**404 Error**: `/api/campaigns` endpoint not found

## Root Cause Analysis

### Possible Causes

1. **Backend Not Running**
   - Production backend process crashed or not started
   - Passenger not configured to start Node.js app
   - Check: Server logs on iFastNet

2. **Build Not Deployed**
   - Latest `distribution/backend/` not uploaded to production
   - Old version of code still running
   - Check: Compare local `distribution/backend/index.cjs` with production

3. **Environment Variables Missing**
   - `PASSENGER_BASE_URI` not set correctly
   - Database connection failing, causing server crash
   - Firebase credentials not configured
   - Check: Production `.env` file

4. **Passenger Configuration**
   - `.htaccess` not configured correctly
   - `passenger.json` or `app.js` startup file issues
   - Path rewriting not working
   - Check: `.htaccess` and Passenger setup files

5. **Module Import Errors**
   - Missing dependencies in production `node_modules`
   - CommonJS `.cjs` conversion failed
   - Import path issues (`.cjs` extension not found)
   - Check: Run `npm install --production` on server

## Deployment Steps (iFastNet Shared Hosting)

### Step 1: Build Latest Code Locally

```bash
# Clean build
rm -rf distribution/

# Build frontend and backend
npm run build

# Verify build succeeded
ls -la distribution/frontend/
ls -la distribution/backend/
```

### Step 2: Upload to Production

**Files to Upload**:
1. `distribution/frontend/*` → Production web root (e.g., `/home/username/public_html/`)
2. `distribution/backend/*` → Backend directory (e.g., `/home/username/forgesteel-api/`)
   - **CRITICAL**: Includes `app.js` (Passenger entry point) - auto-copied by build script
   - **CRITICAL**: All `.cjs` files (CommonJS modules for Node.js with `"type": "module"`)
3. `package.json` → Backend directory
4. `package-lock.json` → Backend directory (for exact dependency versions)
5. `.htaccess` → Web root
6. `.env.production` → Backend directory (rename to `.env`)

**IMPORTANT - app.js Entry Point**:
- `app.js` is the Passenger entry point (configured in `.htaccess`)
- It loads `index.cjs` (not `index.js`)
- Build script automatically copies `server/app.js` to `distribution/backend/app.js`
- **If app.js is missing or wrong, Passenger will load old/missing code**

**DO NOT Upload**:
- `node_modules/` (will install on server)
- `src/` (source code not needed)
- `server/` (source code not needed)
- `.git/` (version control not needed)

### Step 3: Install Dependencies on Server

```bash
# SSH into production server
ssh username@server

# Navigate to backend directory
cd ~/forgesteel-api

# Install production dependencies only
npm install --production

# Verify campaign.routes.cjs exists
ls -la routes/campaign.routes.cjs
```

### Step 4: Configure Environment Variables

Create/update `.env` file in backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Firebase (use production credentials)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# Passenger Configuration
PASSENGER_BASE_URI=/forgesteel/api
PASSENGER_APP_ENV=production

# CORS (your production domain)
ALLOWED_ORIGIN=https://yourdomain.com

# DO NOT SET PORT - Passenger manages this
# PORT is set automatically by Passenger
```

### Step 5: Configure Passenger

**Option A: `.htaccess` (Recommended for iFastNet)**

Create/update `.htaccess` in web root:

```apache
# Passenger Node.js Application
PassengerEnabled on
PassengerNodejs /usr/bin/node
PassengerAppRoot /home/username/forgesteel-api
PassengerStartupFile index.cjs
PassengerAppType node
PassengerBaseURI /forgesteel/api

# Rewrite API requests to Passenger
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/forgesteel/api
RewriteRule ^(.*)$ - [L,QSA]

# Frontend routing (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L,QSA]
```

**Option B: `passenger.json` (Alternative)**

Create `passenger.json` in backend directory:

```json
{
  "app_type": "node",
  "startup_file": "index.cjs",
  "envvars": {
    "NODE_ENV": "production"
  }
}
```

### Step 6: Restart Passenger

```bash
# Create/touch restart.txt to trigger Passenger restart
mkdir -p tmp
touch tmp/restart.txt

# Or restart via control panel
# Check iFastNet control panel for "Restart Application" button
```

### Step 7: Verify Deployment

**Test Health Endpoint**:
```bash
curl https://yourdomain.com/forgesteel/api/healthz
```

Expected response:
```json
{
  "status": "ok",
  "environment": "passenger",
  "baseUri": "/forgesteel/api",
  "node": "v18.x.x",
  "uptime": 123.45
}
```

**Test Campaigns Endpoint**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://yourdomain.com/forgesteel/api/campaigns
```

Expected response: JSON array of campaigns or empty array `[]`

### Step 8: Check Logs

**Passenger Logs**:
```bash
# iFastNet typically stores logs at:
~/logs/passenger.log
~/logs/error_log

# Check for errors
tail -100 ~/logs/passenger.log
tail -100 ~/logs/error_log
```

**Look for**:
- `[BOOT] Starting Forgesteel API...` - Server started
- `[BOOT] ✅ Server listening on port` - Server running
- `Error: Cannot find module` - Missing dependencies
- Database connection errors
- Firebase initialization errors

## Common Issues and Fixes

### Issue: 404 on All API Routes

**Cause**: Passenger not configured or backend not running

**Fix**:
1. Verify `.htaccess` has correct `PassengerAppRoot` path
2. Verify `index.cjs` exists at that path
3. Check Passenger error logs for startup failures
4. Restart Passenger: `touch tmp/restart.txt`

### Issue: 503 Service Unavailable

**Cause**: Backend crashed or failed to start

**Fix**:
1. Check Passenger logs for crash reason
2. Verify all environment variables are set
3. Test database connection manually
4. Check Firebase credentials are valid
5. Ensure `node_modules` installed: `npm install --production`

### Issue: Database Connection Failed

**Cause**: MySQL credentials incorrect or database not accessible

**Fix**:
1. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`
2. Test connection: `mysql -u USER -p -h HOST DATABASE`
3. Ensure MySQL user has correct permissions
4. Check MySQL is running: Contact iFastNet support

### Issue: Firebase Authentication Failed

**Cause**: Firebase credentials not configured correctly

**Fix**:
1. Download service account key from Firebase Console
2. Copy entire private key including newlines: `\n`
3. Set `FIREBASE_PRIVATE_KEY` with escaped newlines in `.env`
4. Verify `FIREBASE_PROJECT_ID` and `FIREBASE_CLIENT_EMAIL` match

### Issue: CORS Errors in Browser

**Cause**: Production domain not in `ALLOWED_ORIGIN`

**Fix**:
1. Add production domain to `.env`: `ALLOWED_ORIGIN=https://yourdomain.com`
2. Restart backend: `touch tmp/restart.txt`
3. Clear browser cache and retry

### Issue: Routes Work Locally But Not in Production

**Cause**: Path normalization not working with Passenger

**Fix**:
1. Verify `PASSENGER_BASE_URI` set correctly in `.env`
2. Check middleware in `index.ts` strips base URI correctly (lines 95-104)
3. Test with curl: `curl https://domain.com/forgesteel/api/healthz`
4. Check Passenger logs for path normalization messages

### Issue: app.js Loading Old index.js Instead of index.cjs

**Cause**: Build system changed to output `.cjs` files (CommonJS) but `app.js` not updated

**Root Cause**:
- `package.json` has `"type": "module"` making Node.js treat `.js` as ES modules
- Backend uses CommonJS (`require()`), so files must be `.cjs`
- Build script renames all `.js` → `.cjs` but `app.js` needs to load `index.cjs`

**Fix**:
1. Update `server/app.js` to require `./index.cjs` instead of `./index.js`
2. Build script now auto-copies `app.js` to distribution: `cp server/app.js distribution/backend/app.js`
3. Upload new `app.js` to production
4. Restart Passenger: `touch ~/forgesteel-api/tmp/restart.txt`

**Verification**:
```bash
# Check app.js on production
cat ~/forgesteel-api/app.js | grep "require"
# Should show: require('./index.cjs')

# Verify index.cjs exists
ls -la ~/forgesteel-api/index.cjs
```

## Quick Diagnostic Commands

```bash
# Check if backend files exist
ls -la ~/forgesteel-api/index.cjs
ls -la ~/forgesteel-api/routes/campaign.routes.cjs

# Check if node_modules installed
ls -la ~/forgesteel-api/node_modules/express

# Check environment variables loaded
cat ~/forgesteel-api/.env

# Check Passenger is recognizing the app
passenger-status

# Restart backend
cd ~/forgesteel-api && mkdir -p tmp && touch tmp/restart.txt

# Test health endpoint
curl https://yourdomain.com/forgesteel/api/healthz

# Test campaigns endpoint (requires auth token)
curl -H "Authorization: Bearer TOKEN" \
     https://yourdomain.com/forgesteel/api/campaigns
```

## Current Deployment Status

**Local Build**: ✅ SUCCESS
- Frontend: Built successfully (10.22s)
- Backend: Built successfully (TypeScript compiled to .cjs)
- Campaign routes: ✅ Present in `distribution/backend/routes/campaign.routes.cjs`
- Server configuration: ✅ Routes registered in `distribution/backend/index.cjs`

**Production Status**: ❌ NOT WORKING
- `/api/campaigns`: 404 Not Found
- Service Worker: 503 Service Unavailable
- Indicates: Backend likely not running or not deployed

**Next Steps**:
1. Verify production has latest `distribution/backend/*` files
2. Check Passenger logs for errors
3. Verify `.env` configuration on production
4. Restart Passenger application
5. Test health endpoint before testing campaigns

## References

- [PASSENGER_DEPLOYMENT_GUIDE.md](PASSENGER_DEPLOYMENT_GUIDE.md) - Full Passenger deployment documentation
- [.htaccess](.htaccess) - Apache/Passenger configuration
- [server/index.ts](server/index.ts) - Server configuration and path normalization
