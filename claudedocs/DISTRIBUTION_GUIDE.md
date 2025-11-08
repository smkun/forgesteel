# Distribution Guide

## Overview

After running `npm run build`, the `distribution/` folder contains everything needed for deployment.

## Build Commands

```bash
# Build both frontend and backend
npm run build

# Build only frontend
npm run build:frontend

# Build only backend
npm run build:backend

# Run backend server from build
npm run server:start
```

## Directory Structure

```
distribution/
├── frontend/          # Static web files (copy to web server)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── main-*.js      # Bundled application
│   └── assets/        # Static assets (images, fonts, etc)
│
└── backend/           # Node.js server files (copy to app server)
    ├── index.cjs      # Server entry point
    ├── data/          # Database repositories
    ├── logic/         # Business logic
    ├── middleware/    # Auth & error handling
    ├── routes/        # API routes
    └── utils/         # Utilities
```

## Deployment

### Frontend Deployment (Static Files)

**Location**: `distribution/frontend/`

**Deployment**:
1. Copy entire `distribution/frontend/` folder contents to web server
2. Configure web server to serve files at `/forgesteel/` base path
3. Ensure `index.html` is served for all routes (SPA routing)

**Server Configuration Example** (Apache):
```apache
<Directory /path/to/forgesteel>
    RewriteEngine On
    RewriteBase /forgesteel/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /forgesteel/index.html [L]
</Directory>
```

### Backend Deployment (Node.js Server)

**Location**: `distribution/backend/`

**Requirements**:
- Node.js v20+
- MySQL database
- Environment variables configured

**Deployment**:
1. Copy entire `distribution/backend/` folder to app server
2. Ensure `.env` file exists in project root (not in distribution/)
3. Start server: `node distribution/backend/index.cjs`

**Passenger Configuration** (Phusion Passenger):
```nginx
# Passenger automatically manages port
# Just point to the entry file
PassengerAppRoot /path/to/forgesteel
PassengerStartupFile distribution/backend/index.cjs
```

## Environment Variables

Backend requires `.env` file in **project root** (one level up from `distribution/`):

```bash
# MySQL Connection
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=your-database
DB_USER=your-user
DB_PASS=your-password

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json

# CORS Origins
ALLOWED_ORIGIN=https://yourdomain.com

# Firebase Client SDK (for frontend build)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com

# Environment
NODE_ENV=production
LOG_LEVEL=info

# CRITICAL: DO NOT SET PORT for Passenger deployments
# Passenger manages port automatically
```

## File Extensions

**Frontend**: Standard `.js` files (ES modules)
**Backend**: `.cjs` files (CommonJS modules)

The backend build process automatically:
1. Compiles TypeScript to JavaScript
2. Renames `.js` → `.cjs` (for CommonJS compatibility)
3. Updates all `require()` statements to use `.cjs` extensions

## Testing Locally

```bash
# 1. Build both frontend and backend
npm run build

# 2. Start backend server (from project root)
npm run server:start
# Server runs at http://localhost:4000

# 3. Serve frontend (separate terminal)
cd distribution/frontend
python -m http.server 5173
# Frontend runs at http://localhost:5173/forgesteel/
```

## Production Checklist

- [ ] Run `npm run build` to generate fresh build
- [ ] Copy `distribution/frontend/` to web server
- [ ] Copy `distribution/backend/` to app server
- [ ] Ensure `.env` is configured in project root
- [ ] Verify Firebase service account JSON exists at configured path
- [ ] Test API endpoints: `https://yourdomain.com/forgesteel/api/health`
- [ ] Test frontend loads: `https://yourdomain.com/forgesteel/`
- [ ] Verify authentication works (sign in/sign out)
- [ ] Check browser console for errors

## Troubleshooting

### "Cannot find module" errors
- Ensure all `.cjs` files were generated correctly
- Check that `require()` statements use `.cjs` extensions
- Rebuild: `npm run build:backend`

### Frontend shows blank page
- Check browser console for errors
- Verify `index.html` is being served for all routes
- Confirm base path is `/forgesteel/` in URL

### API CORS errors
- Verify `ALLOWED_ORIGIN` in `.env` matches frontend domain
- Check backend logs for CORS configuration
- Ensure production build uses correct API_BASE_URL

### Double `/api/api/` in requests
- This should be fixed in production builds
- API_BASE_URL is: `https://yourdomain.com/forgesteel` (no `/api` suffix)
- Endpoints append `/api/...` paths automatically
