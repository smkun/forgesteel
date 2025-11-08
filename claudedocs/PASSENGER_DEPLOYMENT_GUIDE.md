# Passenger Deployment Architecture Guide

## Executive Summary

This document details the architectural challenges encountered when deploying a Node.js Express API to iFastNet shared hosting using Phusion Passenger, and the complete solution that resolved persistent stability issues.

**Key Issue**: Attempting to use Apache reverse proxy to forward requests to a self-managed Node.js process (listening on port 3000) instead of letting Passenger directly manage the application.

**Solution**: Complete architectural redesign using Passenger mount directory pattern with path normalization, eliminating all reverse proxy attempts.

---

## Table of Contents

1. [Problem Overview](#problem-overview)
2. [Initial Architecture (Failed Approach)](#initial-architecture-failed-approach)
3. [Root Cause Analysis](#root-cause-analysis)
4. [Solution Architecture](#solution-architecture)
5. [Implementation Details](#implementation-details)
6. [Code Changes Required](#code-changes-required)
7. [Deployment Structure](#deployment-structure)
8. [Verification Methods](#verification-methods)
9. [Common Pitfalls](#common-pitfalls)
10. [Production Checklist](#production-checklist)

---

## Problem Overview

### Environment
- **Hosting**: iFastNet shared hosting with CloudLinux
- **Web Server**: Apache with Phusion Passenger
- **Application**: Node.js Express API (Node 20.x)
- **Frontend**: React SPA deployed at `/public_html/d6StarWars/`
- **API**: Node.js app at `/nodejs/star-wars-api/`

### Symptoms
- Server required manual SSH start with `nohup node api/run-local-server.js &`
- Control panel restart button didn't start the server
- API would stop responding randomly
- Requests to `/d6StarWars/api/*` returned 404 or connection errors
- No automatic process management or recovery

### What We Tried (That Didn't Work)
1. ✗ Apache `.htaccess` reverse proxy: `RewriteRule ^api/(.*)$ http://127.0.0.1:3000/$1 [P,L]`
2. ✗ ProxyPass directives in `.htaccess`
3. ✗ Manual `nohup` background processes
4. ✗ Passenger directives in main SPA `.htaccess`
5. ✗ Setting PORT environment variable in `.env`

---

## Initial Architecture (Failed Approach)

### Directory Structure
```
/home/gamers/
├── public_html/
│   └── d6StarWars/              # React SPA frontend
│       ├── index.html
│       ├── assets/
│       └── .htaccess            # ❌ Tried to proxy here
└── nodejs/
    └── star-wars-api/           # Node.js API
        ├── app.js
        ├── api/
        │   └── run-local-server.js
        └── package.json
```

### What We Attempted

#### Attempt 1: Reverse Proxy in SPA .htaccess
```apache
# /public_html/d6StarWars/.htaccess
RewriteEngine On
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

**Why It Failed:**
- Passenger is NOT a reverse proxy system
- Server wasn't running on port 3000 (no process management)
- Apache couldn't proxy to non-existent process
- Manual `nohup` required, no auto-restart

#### Attempt 2: Manual Process Management
```bash
# SSH into server
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate
cd /home/gamers/nodejs/star-wars-api
nohup node api/run-local-server.js > server.log 2>&1 &
```

**Why It Failed:**
- Process wouldn't survive deployments
- Control panel restart didn't work
- No auto-recovery if process crashed
- Manual intervention required after every deployment

#### Attempt 3: Passenger Directives in Wrong Location
```apache
# /public_html/d6StarWars/.htaccess
PassengerAppRoot "/home/gamers/nodejs/star-wars-api"
PassengerStartupFile app.js
```

**Why It Failed:**
- Passenger directives were in SPA directory, not mount point
- Confused Passenger about which app to serve (SPA vs API)
- Path routing conflicts between SPA and API

---

## Root Cause Analysis

### Fundamental Misunderstanding

**What We Thought**: Passenger is like a service manager that runs Node.js apps in background, and Apache proxies requests to them.

**Reality**: Passenger is an application server that directly handles HTTP requests by spawning and managing app processes on-demand.

### Key Concepts We Missed

1. **Passenger Mount Directories**: Passenger requires a dedicated directory where `.htaccess` contains Passenger directives
2. **Path Normalization**: Passenger sets `PASSENGER_BASE_URI` but doesn't strip it from request paths automatically
3. **Port Management**: Passenger apps don't listen on fixed ports; Passenger manages the socket connection
4. **Process Lifecycle**: Passenger spawns/kills processes automatically based on traffic and restarts

### Technical Details

#### How Passenger Actually Works
```
HTTP Request → Apache → Passenger Module → Spawns Node.js Process
                                         → Passes request directly to app
                                         → Returns response through Passenger
                                         → Manages process lifecycle
```

#### NOT How Passenger Works (Our Mistake)
```
HTTP Request → Apache → RewriteRule proxy → localhost:3000
                                          → Separate Node.js process
                                          → Manual management required
```

---

## Solution Architecture

### Correct Passenger Deployment Pattern

```
/home/gamers/
├── public_html/
│   ├── d6StarWars/                    # Main SPA directory
│   │   ├── index.html                 # React frontend
│   │   ├── assets/
│   │   ├── api/                       # ← PASSENGER MOUNT DIRECTORY
│   │   │   └── .htaccess              # ← Passenger config HERE
│   │   └── .htaccess                  # SPA routing (excludes /api)
│   └── .htaccess                      # Optional: /api → /d6StarWars/api
└── nodejs/
    └── star-wars-api/                 # Actual app code (separate)
        ├── app.js                     # Passenger entry point
        ├── api/
        │   └── run-local-server.js    # Express server
        ├── package.json
        └── .env
```

### Request Flow

1. Client: `GET /d6StarWars/api/species`
2. Apache matches `/d6StarWars/api/` directory
3. Apache reads `/public_html/d6StarWars/api/.htaccess`
4. Passenger directive found: `PassengerAppRoot "/home/gamers/nodejs/star-wars-api"`
5. Passenger spawns app if not running (via `app.js`)
6. Passenger sets `PASSENGER_BASE_URI = "/d6StarWars/api"`
7. Request forwarded to Node.js app with path `/d6StarWars/api/species`
8. **Path normalization** strips `/d6StarWars/api` → `/species`
9. Express route handler receives `/species`
10. Response returned through Passenger to client

---

## Implementation Details

### 1. Passenger Mount Directory (.htaccess)

**Location**: `/public_html/d6StarWars/api/.htaccess`

```apache
# Passenger Mount Block
PassengerEnabled on
PassengerAppRoot "/home/gamers/nodejs/star-wars-api"
PassengerBaseURI "/d6StarWars/api"
PassengerNodejs "/home/gamers/nodevenv/nodejs/star-wars-api/20/bin/node"
PassengerAppType node
PassengerStartupFile app.js
PassengerAppLogFile "/home/gamers/logs/starwarsd6-passenger.log"

# Debugging headers (optional, remove in production)
Header set X-HTACCESS "api-mount"
Header set X-Passenger-Root "%{PASSENGER_ROOT}e"
Header set X-Passenger-BaseURI "%{PASSENGER_BASE_URI}e"
```

**Key Directives Explained:**

- `PassengerEnabled on` - Activate Passenger for this directory
- `PassengerAppRoot` - Physical location of Node.js app code
- `PassengerBaseURI` - URL path prefix (what Apache sees)
- `PassengerNodejs` - Path to Node.js binary in virtual environment
- `PassengerAppType node` - Application type (vs Ruby, Python, etc.)
- `PassengerStartupFile` - Entry point script (our wrapper)
- `PassengerAppLogFile` - Where Passenger writes app output

### 2. SPA .htaccess (Excludes API)

**Location**: `/public_html/d6StarWars/.htaccess`

```apache
# SPA routing with API exclusion
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Debugging header
  Header set X-HTACCESS "spa-root"

  # CRITICAL: Exclude /api from SPA routing
  RewriteCond %{REQUEST_URI} !^/d6StarWars/api/

  # Skip rewrite for existing files
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Route everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

**Why This Matters:**
- Without API exclusion, SPA routing would intercept `/api/*` requests
- Passenger mount would never be reached
- API requests would return `index.html` instead of data

### 3. Optional Root-Level Redirect

**Location**: `/public_html/.htaccess`

```apache
# Convenience redirect: /api → /d6StarWars/api
<IfModule mod_rewrite.c>
  RewriteEngine On
  Header set X-HTACCESS "root-public_html"

  # Redirect /api to subfolder mount
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ /d6StarWars/api/$1 [L]
</IfModule>
```

**Purpose**: Allows clients to use `/api/species` instead of `/d6StarWars/api/species`

---

## Code Changes Required

### 1. Passenger Entry Point Wrapper

**Location**: `/home/gamers/nodejs/star-wars-api/app.js`

```javascript
// @ts-nocheck
/* eslint-env node */

/**
 * Passenger entry point wrapper
 * iFastNet Passenger expects app.js in application root
 * This loads the actual server at api/run-local-server.js
 */
require('./api/run-local-server.js');
```

**Why Needed:**
- Passenger looks for `app.js` or `server.js` by default
- Our actual server is in subdirectory: `api/run-local-server.js`
- Wrapper provides standard entry point while keeping code organized

### 2. Server Code Path Normalization

**Location**: `/home/gamers/nodejs/star-wars-api/api/run-local-server.js`

#### Boot-Time Passenger Detection

```javascript
// Detect Passenger environment
const isPassenger = !!(
  process.env.PASSENGER_BASE_URI ||
  process.env.PASSENGER_APP_ENV
);

console.log(`[BOOT] Starting server...`);
console.log(`[BOOT] Environment: ${isPassenger ? 'Passenger' : 'Local Dev'}`);
console.log(`[BOOT] Node version: ${process.version}`);
console.log(`[BOOT] PASSENGER_BASE_URI: ${process.env.PASSENGER_BASE_URI || 'not set'}`);
console.log(`[BOOT] PASSENGER_APP_ENV: ${process.env.PASSENGER_APP_ENV || 'not set'}`);
```

#### Request Path Normalization

```javascript
const http = require('http');

// Create HTTP server with path normalization
const server = http.createServer((req, res) => {
  // Log every request for debugging
  console.log(`[REQUEST] ${req.method} ${req.url} from ${req.headers.host}`);

  // Strip PASSENGER_BASE_URI if present
  // iFastNet's Passenger doesn't do this automatically
  const baseUri = process.env.PASSENGER_BASE_URI || '';
  let urlPath = req.url || '/';

  try {
    // Parse full URL to get clean pathname
    urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  } catch (_) {
    // URL parsing failed, use as-is
  }

  // Strip base URI prefix
  if (baseUri && urlPath.startsWith(baseUri)) {
    urlPath = urlPath.slice(baseUri.length) || '/';
  }

  // Update req.url for Express to handle correctly
  const pathname = urlPath;

  // Now existing route handlers work unchanged
  // Express sees: /species, /characters, etc.
  // Instead of: /d6StarWars/api/species, /d6StarWars/api/characters

  // ... rest of Express route handling
});
```

**Critical Logic:**
1. Check if `PASSENGER_BASE_URI` is set (e.g., `/d6StarWars/api`)
2. Parse incoming request URL to get pathname
3. Strip base URI prefix if present
4. Pass normalized path to Express routes

**Example Flow:**
```javascript
// Incoming from Passenger:
req.url = '/d6StarWars/api/species'
baseUri = '/d6StarWars/api'

// After normalization:
pathname = '/species'

// Express route matches:
app.get('/species', ...) // ✅ Works!
```

#### Intelligent Port Selection

```javascript
// Passenger-safe port selection
const isPassenger = !!(
  process.env.PASSENGER_BASE_URI ||
  process.env.PASSENGER_APP_ENV
);

// Passenger: use 3000 (or PORT if set)
// Local dev: use 4000 (or PORT if set)
const PORT = isPassenger
  ? Number(process.env.PORT || 3000)
  : Number(process.env.PORT || 4000);

server.listen(PORT, () => {
  console.log(`[BOOT] Server listening on port ${PORT}`);
  console.log(`[BOOT] Mode: ${isPassenger ? 'Passenger managed' : 'Local development'}`);
});
```

**Why Different Ports:**
- **Passenger (3000)**: Standard Passenger port, managed by Passenger
- **Local Dev (4000)**: Avoids conflicts with Vite (5173) and other dev servers
- **No PORT in .env**: Let code handle port selection automatically

#### Health Check Endpoints

```javascript
// Health check for Passenger and monitoring
if (pathname === '/' || pathname === '/healthz') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    environment: isPassenger ? 'passenger' : 'local',
    baseUri: process.env.PASSENGER_BASE_URI || 'none',
    node: process.version,
    uptime: process.uptime()
  }));
  return;
}
```

**Purpose:**
- Passenger can monitor app health
- DevOps can check if app is responding
- Debugging shows environment details

### 3. Package.json Production Configuration

**Location**: `/home/gamers/nodejs/star-wars-api/package.json`

```json
{
  "name": "star-wars-d6-api",
  "version": "1.0.0",
  "description": "Star Wars d6 MySQL API Server",
  "private": true,
  "main": "app.js",
  "dependencies": {
    "dotenv": "^16.4.5",
    "firebase-admin": "^12.7.0",
    "mysql2": "^3.15.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Key Points:**
- `"main": "app.js"` - Passenger uses this if `PassengerStartupFile` not set
- Only runtime dependencies (no devDependencies)
- No workspace configuration (clean production package)
- Node.js version constraint for compatibility

---

## Deployment Structure

### Complete File Tree

```
Production Server (iFastNet)
/home/gamers/
│
├── public_html/                       # Web root
│   ├── d6StarWars/                   # Project subfolder
│   │   ├── index.html                # React SPA entry
│   │   ├── assets/                   # JS/CSS bundles
│   │   │   ├── index-CyEyQxIs.js    # 664 KB
│   │   │   └── index-DiwrgTda.css   # 39 KB
│   │   ├── aliens/                   # Species images
│   │   ├── starships/                # Starship images
│   │   ├── api/                      # ⭐ PASSENGER MOUNT
│   │   │   └── .htaccess             # Passenger directives
│   │   └── .htaccess                 # SPA routing (excludes /api)
│   └── .htaccess                     # Optional /api redirect
│
├── nodejs/                           # Node.js apps directory
│   └── star-wars-api/                # API application
│       ├── app.js                    # ⭐ Passenger entry point
│       ├── api/
│       │   └── run-local-server.js   # ⭐ Express server
│       ├── package.json              # Production dependencies
│       ├── node_modules/             # npm install --production
│       │   ├── mysql2/
│       │   ├── dotenv/
│       │   └── firebase-admin/
│       └── .env                      # Environment variables
│
├── nodevenv/                         # Node.js virtual environment
│   └── nodejs/
│       └── star-wars-api/
│           └── 20/
│               └── bin/
│                   └── node          # Node.js 20.x binary
│
└── logs/                             # Application logs
    └── starwarsd6-passenger.log      # Passenger app output
```

### Environment Variables (.env)

**Location**: `/home/gamers/nodejs/star-wars-api/.env`

```bash
# Database connection
MYSQL_URL=mysql://username:password@host:3306/database

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/home/gamers/.config/firebase/service-account.json

# CORS (production domain)
ALLOWED_ORIGIN=https://yourdomain.com

# DO NOT SET PORT - let code handle automatically
# PORT=3000  ← REMOVE THIS (causes Passenger conflicts)

# Development auth bypass (only for local dev)
# DEV_AUTH=true  ← NEVER in production
```

**Critical Notes:**
- ❌ **Do not set PORT** - causes conflicts with Passenger port management
- ✅ **Set MYSQL_URL** - database connection string
- ✅ **Set GOOGLE_APPLICATION_CREDENTIALS** - absolute path to service account JSON
- ✅ **Set ALLOWED_ORIGIN** - production domain for CORS

---

## Verification Methods

### 1. Check Passenger Process Status

```bash
# SSH into server
ssh username@hostname

# View Passenger processes
passenger-status

# Expected output:
# Version : 5.x.x
# ...
# Processes: 1
#  * PID: 12345   Sessions: 0    Processed: 123   Uptime: 5m
#    CPU: 0%      Memory: 45M    Last used: 2s ago
```

### 2. Test Health Endpoint

```bash
# Test API health
curl https://yourdomain.com/d6StarWars/api/

# Expected response:
{
  "status": "ok",
  "environment": "passenger",
  "baseUri": "/d6StarWars/api",
  "node": "v20.12.0",
  "uptime": 3600
}
```

### 3. Monitor Passenger Logs

```bash
# Watch real-time logs
tail -f ~/logs/starwarsd6-passenger.log

# Should see:
[BOOT] Starting server...
[BOOT] Environment: Passenger
[BOOT] Node version: v20.12.0
[BOOT] PASSENGER_BASE_URI: /d6StarWars/api
[REQUEST] GET /d6StarWars/api/species from yourdomain.com
```

### 4. Test API Endpoints

```bash
# Test species list (public endpoint)
curl https://yourdomain.com/d6StarWars/api/species

# Test authenticated endpoint (should get 401)
curl https://yourdomain.com/d6StarWars/api/characters

# Test with auth token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://yourdomain.com/d6StarWars/api/characters
```

### 5. Verify .htaccess Execution Order

```bash
# Check response headers to see which .htaccess files were processed
curl -I https://yourdomain.com/d6StarWars/api/species

# Look for debug headers:
X-HTACCESS: api-mount
X-Passenger-Root: /usr/local/lsws/lsphp80/bin
X-Passenger-BaseURI: /d6StarWars/api
```

---

## Common Pitfalls

### 1. ❌ Reverse Proxy Attempts

**Don't Do This:**
```apache
# /public_html/d6StarWars/.htaccess
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

**Why It Fails:**
- Passenger is not a reverse proxy
- No process listening on port 3000
- Creates dependency on manual process management

**Do This Instead:**
- Use Passenger mount directory pattern
- Let Passenger spawn and manage the process

### 2. ❌ Setting PORT in .env

**Don't Do This:**
```bash
# .env
PORT=3000
```

**Why It Fails:**
- Conflicts with Passenger's port management
- Passenger expects app to listen on dynamically assigned port
- Can cause "address already in use" errors

**Do This Instead:**
- Remove PORT from .env entirely
- Let code select port based on environment:
  ```javascript
  const PORT = isPassenger ? 3000 : 4000;
  ```

### 3. ❌ Passenger Directives in Wrong Location

**Don't Do This:**
```apache
# /public_html/d6StarWars/.htaccess (SPA directory)
PassengerEnabled on
PassengerAppRoot "/home/gamers/nodejs/star-wars-api"
```

**Why It Fails:**
- Confuses Passenger about which app to serve (SPA vs API)
- Can't differentiate between static files and API routes

**Do This Instead:**
- Create separate mount directory: `/public_html/d6StarWars/api/`
- Put Passenger directives in mount `.htaccess`

### 4. ❌ Forgetting Path Normalization

**Don't Do This:**
```javascript
// Assume req.url is already normalized
app.get('/species', (req, res) => {
  // This won't match: actual path is /d6StarWars/api/species
});
```

**Why It Fails:**
- Passenger doesn't strip `PASSENGER_BASE_URI` automatically
- Express routes never match incoming paths

**Do This Instead:**
- Add path normalization middleware (shown in code changes section)
- Strip base URI before routing

### 5. ❌ Using app.listen() Incorrectly

**Don't Do This:**
```javascript
// Hard-coded port
app.listen(3000, () => {
  console.log('Server on port 3000');
});
```

**Why It Fails:**
- Passenger may assign a different port
- Local dev and production conflict on same port

**Do This Instead:**
```javascript
const PORT = isPassenger ? 3000 : 4000;
server.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
```

---

## Production Checklist

### Pre-Deployment

- [ ] Build production frontend: `npm run build` in `/web`
- [ ] Copy frontend to: `/public_html/d6StarWars/`
- [ ] Create API mount directory: `/public_html/d6StarWars/api/`
- [ ] Upload API code to: `/nodejs/star-wars-api/`
- [ ] Create `.env` file with production values
- [ ] Upload service account JSON to secure location (600 permissions)
- [ ] Install production dependencies: `npm install --production`

### Configuration Files

- [ ] `/public_html/d6StarWars/api/.htaccess` - Passenger mount directives
- [ ] `/public_html/d6StarWars/.htaccess` - SPA routing (excludes /api)
- [ ] `/public_html/.htaccess` - Optional /api redirect (optional)
- [ ] `/nodejs/star-wars-api/.env` - Environment variables (no PORT!)
- [ ] `/nodejs/star-wars-api/app.js` - Passenger entry point wrapper

### Code Verification

- [ ] Path normalization implemented in server code
- [ ] Intelligent port selection (Passenger vs local dev)
- [ ] Health check endpoints (`/` and `/healthz`)
- [ ] Boot-time logging for environment detection
- [ ] Per-request logging for debugging

### Post-Deployment Testing

- [ ] Restart app via iFastNet control panel
- [ ] Verify Passenger spawns process: `passenger-status`
- [ ] Test health endpoint: `curl /d6StarWars/api/`
- [ ] Test public endpoint: `curl /d6StarWars/api/species`
- [ ] Test authenticated endpoint (should get 401)
- [ ] Test authenticated endpoint with valid token
- [ ] Check Passenger logs: `tail -f ~/logs/starwarsd6-passenger.log`
- [ ] Verify request paths normalized correctly in logs
- [ ] Test frontend → API communication

### Monitoring

- [ ] Check Passenger logs regularly for errors
- [ ] Monitor process count: `passenger-status`
- [ ] Verify auto-restart after crash (simulate with `kill -9`)
- [ ] Test restart via control panel
- [ ] Monitor response times and memory usage

---

## Summary

### What We Learned

1. **Passenger is an application server, not a process manager**
   - It spawns and manages app processes directly
   - No need for reverse proxy or manual process management

2. **Mount directory pattern is essential**
   - Dedicated directory for Passenger configuration
   - Separate from both app code and SPA files

3. **Path normalization is required**
   - iFastNet's Passenger doesn't strip `PASSENGER_BASE_URI`
   - Must be handled in application code

4. **Port management must be intelligent**
   - Different ports for Passenger vs local dev
   - Never set PORT in .env for Passenger deployments

5. **Entry point matters**
   - Passenger expects `app.js` or `server.js`
   - Wrapper pattern allows organized code structure

### Key Files Summary

| File | Purpose | Critical Content |
|------|---------|------------------|
| `/public_html/d6StarWars/api/.htaccess` | Passenger mount | `PassengerAppRoot`, `PassengerBaseURI` |
| `/nodejs/star-wars-api/app.js` | Entry wrapper | `require('./api/run-local-server.js')` |
| `/nodejs/star-wars-api/api/run-local-server.js` | Express server | Path normalization, port selection |
| `/public_html/d6StarWars/.htaccess` | SPA routing | Exclude `/api` from rewrites |
| `/nodejs/star-wars-api/.env` | Environment | NO PORT variable |

### Success Metrics

✅ Server auto-starts via Passenger (no manual SSH)
✅ Control panel restart successfully restarts app
✅ All API endpoints responding correctly
✅ Path normalization working (logs show normalized paths)
✅ No reverse proxy dependencies
✅ Production deployment stable and reliable

---

## Additional Resources

- Passenger Documentation: https://www.phusionpassenger.com/docs/
- iFastNet Node.js Guide: https://ifastnet.com/portal/knowledgebase/
- CloudLinux Documentation: https://docs.cloudlinux.com/

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Author**: Based on production deployment of Star Wars d6 Species Catalog
**Environment**: iFastNet shared hosting with CloudLinux + Phusion Passenger
