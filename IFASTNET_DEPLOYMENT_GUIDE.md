# iFastNet Deployment Guide for Firebase + MySQL + TypeScript Apps

**Target Platform**: iFastNet/InfinityFree shared hosting with Phusion Passenger
**Stack**: Firebase Auth + MySQL + Node.js Backend + TypeScript Frontend
**Last Updated**: 2024-11-08

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical Gotchas](#critical-gotchas)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Deployment Checklist](#deployment-checklist)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [File Structure Reference](#file-structure-reference)

---

## Architecture Overview

### Deployment Structure

```
public_html/
└── your-app/              # Base path (e.g., /forgesteel)
    ├── index.html         # Frontend entry point
    ├── assets/            # Frontend static files
    │   ├── main-*.js
    │   └── main-*.css
    ├── .htaccess          # Apache/Passenger config
    └── api/               # Symbolic link to Node.js app (managed by Passenger)
        └── (handled by Passenger, routes to Node.js app)

nodejs/
└── your-app-api/          # Node.js application root
    ├── .env               # Environment variables
    ├── app.js             # Passenger entry point (CRITICAL)
    ├── package.json       # Backend-only dependencies
    ├── node_modules/      # Installed via npm install
    ├── index.js           # Main server file (compiled from TypeScript)
    ├── data/              # Database repositories
    ├── logic/             # Business logic
    ├── middleware/        # Express middleware
    ├── routes/            # API routes
    └── utils/             # Utilities (including loadEnv.js)
```

### Request Flow

```
User Request → Apache
  ↓
  ├─ Static files (HTML/CSS/JS) → Serve directly from public_html/
  │
  └─ /api/* requests → Passenger
       ↓
       app.js → index.js → Express routes → Database/Firebase
```

---

## Critical Gotchas

### 🔴 GOTCHA #1: Passenger Entry Point

**Issue**: Passenger expects `app.js` in the Node.js app root, NOT `index.js`

**Solution**: Create `app.js` that requires your compiled `index.js`:

```javascript
/**
 * Passenger Entry Point Wrapper (CommonJS)
 *
 * iFastNet Phusion Passenger expects app.js in the app root.
 * This bootstraps the compiled backend at index.js.
 */

try {
  require('./index.js');
  console.log('[PASSENGER] Server started successfully');
} catch (err) {
  console.error('[PASSENGER] Failed to start server:', err);
  process.exit(1);
}
```

**Why**: Passenger hardcoded to look for `app.js`, but TypeScript compiles to `index.js`

---

### 🔴 GOTCHA #2: Environment Variable Loading

**Issue**: `.env` file path resolution fails because Passenger changes working directory

**Problem Code**:
```typescript
// ❌ WRONG - uses relative path from cwd
dotenv.config({ path: '.env' });
```

**Solution**: Try multiple possible paths:

```typescript
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Try multiple possible .env locations
const possiblePaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../../../.env.local'),
  path.join(__dirname, '../../../../.env'),
  path.join(__dirname, '../../.env.local'),
  path.join(__dirname, '../../.env')
];

let envPath = '.env'; // fallback
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    envPath = testPath;
    break;
  }
}

console.log('[ENV] Current working directory:', process.cwd());
console.log('[ENV] Module directory:', __dirname);
console.log('[ENV] Loading environment from:', envPath);
console.log('[ENV] File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });
```

**Why**: Passenger may set different working directory than app root

---

### 🔴 GOTCHA #3: MySQL Connection String Encoding

**Issue**: Special characters in password break URI-based connections

**Problem Code**:
```typescript
// ❌ WRONG - URL encoding breaks with special chars like %?&
const pool = mysql.createPool({
  uri: process.env.MYSQL_URL  // mysql://user:pass%word@host/db
});
```

**Solution**: Use individual connection parameters:

```typescript
import mysql from 'mysql2/promise';

console.log('[DB] Initializing connection pool...');
console.log('[DB] Host:', process.env.DB_HOST);
console.log('[DB] Port:', process.env.DB_PORT);
console.log('[DB] Database:', process.env.DB_NAME);
console.log('[DB] User:', process.env.DB_USER);
console.log('[DB] Password:', process.env.DB_PASS ? '***SET***' : 'NOT SET');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,  // Raw password, no encoding needed
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

**Why**: URL encoding is error-prone with passwords containing `%`, `?`, `&`, etc.

---

### 🔴 GOTCHA #4: API Base URL Double `/api/` Issue

**Issue**: Frontend URLs become `/app-name/api/api/endpoint` instead of `/app-name/api/endpoint`

**Problem**:
```bash
# ❌ WRONG
VITE_API_BASE_URL=https://32gamers.com/forgesteel/api
```

**Solution**:
```bash
# ✅ CORRECT - No /api suffix
VITE_API_BASE_URL=https://32gamers.com/forgesteel
```

**Frontend Code** (should append `/api/`):
```typescript
// api.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getUser = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/me`);
  // Results in: https://32gamers.com/forgesteel/api/auth/me ✅
};
```

**Why**: Frontend code already appends `/api/` to all endpoints

---

### 🔴 GOTCHA #5: TypeScript Compilation Output Structure

**Issue**: TypeScript `rootDir` creates nested `dist/server/` structure

**Problem tsconfig.json**:
```json
{
  "compilerOptions": {
    "rootDir": "..",      // Parent directory includes src/ and server/
    "outDir": "./dist"    // Creates dist/server/ and dist/src/
  }
}
```

**Result**:
```
server/dist/
├── server/           # ❌ Nested - app.js can't find this
│   ├── index.js
│   ├── data/
│   └── utils/
└── src/              # Frontend compiled files
```

**Solution**: After build, flatten the structure:

```bash
# Build
npm run server:build

# Flatten (copy server/dist/server/* to server/dist/)
cp -r server/dist/server/* server/dist/

# Deploy server/dist/ contents to /home/user/nodejs/app-name/
```

**Why**: `app.js` expects `./index.js` at same level, not `./server/index.js`

---

### 🔴 GOTCHA #6: PORT Environment Variable

**Issue**: Setting `PORT` in `.env` causes Passenger conflicts

**Problem**:
```bash
# ❌ WRONG - Passenger manages ports
PORT=3000
```

**Solution**: DO NOT set PORT for Passenger deployments

```bash
# ✅ CORRECT - Let Passenger manage port
# PORT is commented out or not present

# Add this comment to .env:
# CRITICAL: DO NOT SET PORT FOR PASSENGER DEPLOYMENTS
# Passenger manages port automatically - setting PORT causes conflicts
```

**Server Code**:
```typescript
// Let Passenger assign the port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[BOOT] ✅ Server listening on port ${PORT}`);
  console.log(`[BOOT] Mode: ${isPassenger ? 'Passenger managed' : 'Standalone'}`);
});
```

**Why**: Passenger injects its own PORT, conflicts with manual PORT setting

---

### 🔴 GOTCHA #7: .htaccess Configuration

**Issue**: Incorrect `.htaccess` breaks routing or creates 500 errors

**Correct .htaccess**:

```apache
Header add X-HTACCESS "your-app-name"

# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/username/nodejs/your-app-api"
PassengerBaseURI "/your-app"
PassengerNodejs "/home/username/nodevenv/nodejs/your-app-api/20/bin/node"
PassengerAppType node
PassengerStartupFile app.js
PassengerAppLogFile "/home/username/logs/your-app-passenger.log"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /your-app/

  # Let /your-app/api/* fall through to Passenger
  RewriteRule ^api/ - [L]

  # React Router fallback for the SPA
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /your-app/index.html [L]
</IfModule>
```

**Key Points**:
- `PassengerBaseURI` matches your app path (e.g., `/forgesteel`)
- `RewriteRule ^api/` lets API requests pass to Passenger
- React Router fallback for SPA routing
- **Never use `/api` suffix in PassengerBaseURI**

**Why**: Passenger needs correct base URI, API requests must bypass static file handling

---

### 🔴 GOTCHA #8: Firebase Service Account Path

**Issue**: Relative paths fail, absolute path required

**Problem**:
```bash
# ❌ WRONG - relative path
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

**Solution**:
```bash
# ✅ CORRECT - absolute path on server
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/firebase-service-account.json
```

**Upload Firebase JSON**:
```bash
# Create directory (via cPanel terminal)
mkdir -p /home/username/.config/firebase

# Upload firebase-service-account.json to this directory
# Set permissions
chmod 600 /home/username/.config/firebase/firebase-service-account.json
```

**Why**: Working directory changes, relative paths unreliable

---

### 🔴 GOTCHA #9: Backend-Only package.json

**Issue**: Deploying root `package.json` with frontend dependencies bloats deployment

**Problem**: Root package.json includes React, Vite, etc. (not needed on server)

**Solution**: Create `server/package.json` with ONLY backend dependencies:

```json
{
  "name": "your-app-api",
  "version": "1.0.0",
  "type": "commonjs",
  "description": "Your App Backend API Server",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "firebase-admin": "^13.6.0",
    "mysql2": "^3.15.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Deploy**: Upload this `package.json` to server, run `npm install` in cPanel

**Why**: Reduces deployment size, faster installs, cleaner production environment

---

### 🔴 GOTCHA #10: CommonJS vs ES Modules

**Issue**: TypeScript compiles to CommonJS but code uses ES module syntax

**Problem**:
```javascript
// ❌ WRONG - async import() in CommonJS package.json
try {
  await import('./index.js');
} catch (err) {
  console.error('Failed:', err);
}
```

**Solution**: Use `require()` in `app.js`:

```javascript
// ✅ CORRECT - CommonJS require
try {
  require('./index.js');
  console.log('[PASSENGER] Server started successfully');
} catch (err) {
  console.error('[PASSENGER] Failed to start server:', err);
  process.exit(1);
}
```

**package.json**:
```json
{
  "type": "commonjs"  // Must match compiled output
}
```

**Why**: Passenger expects CommonJS, mixing module systems causes errors

---

## Backend Setup

### 1. TypeScript Configuration

**server/tsconfig.json**:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "..",
    "outDir": "./dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": [
    "**/*.ts",
    "../src/models/**/*.ts",
    "../src/enums/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### 2. Environment Variables (.env)

```bash
# MySQL Connection (use individual parameters, NOT URL)
DB_HOST=31.22.4.44
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_username
DB_PASS=YourPasswordHere

# Firebase Admin SDK (absolute path on server)
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/firebase-service-account.json

# CORS Origins (comma-separated)
ALLOWED_ORIGIN=https://yourdomain.com

# Firebase Client SDK (for frontend)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_API_BASE_URL=https://yourdomain.com/your-app

# Environment
NODE_ENV=production

# Logging
LOG_LEVEL=info

# CRITICAL: DO NOT SET PORT FOR PASSENGER DEPLOYMENTS
# Passenger manages port automatically - setting PORT causes conflicts
# PORT is only for non-Passenger deployments
```

### 3. Server Entry Point (server/index.ts)

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import './utils/loadEnv';  // Load environment first!

// Detect Passenger environment
const isPassenger = !!(
  process.env.PASSENGER_BASE_URI ||
  process.env.PASSENGER_APP_ENV
);

console.log(`[BOOT] Starting Your App API...`);
console.log(`[BOOT] Environment: ${isPassenger ? 'Passenger (iFastNet)' : 'Local Development'}`);
console.log(`[BOOT] Node version: ${process.version}`);
console.log(`[BOOT] PASSENGER_BASE_URI: ${process.env.PASSENGER_BASE_URI || 'not set'}`);

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Path normalization for Passenger
if (isPassenger && process.env.PASSENGER_BASE_URI) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const baseUri = process.env.PASSENGER_BASE_URI;
    if (req.path.startsWith(baseUri)) {
      req.url = req.url.substring(baseUri.length);
      console.log(`[PATH] Normalized: ${req.path} → ${req.url}`);
    }
    next();
  });
}

// Import routes
import authRoutes from './routes/auth.routes';
import characterRoutes from './routes/character.routes';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Health check
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[BOOT] ✅ Server listening on port ${PORT}`);
  console.log(`[BOOT] Mode: ${isPassenger ? 'Passenger managed' : 'Standalone'}`);
  console.log(`[BOOT] Health check: http://localhost:${PORT}/healthz`);

  if (isPassenger) {
    console.log(`[BOOT] Passenger will handle process lifecycle`);
    console.log(`[BOOT] Base URI: ${process.env.PASSENGER_BASE_URI}`);
  }
});
```

### 4. Database Connection (server/data/db-connection.ts)

```typescript
import mysql from 'mysql2/promise';
import '../utils/loadEnv';

console.log('[DB] Initializing connection pool...');
console.log('[DB] Host:', process.env.DB_HOST);
console.log('[DB] Port:', process.env.DB_PORT);
console.log('[DB] Database:', process.env.DB_NAME);
console.log('[DB] User:', process.env.DB_USER);
console.log('[DB] Password:', process.env.DB_PASS ? '***SET***' : 'NOT SET');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] ✅ MySQL connection pool established');

    await connection.query('SELECT 1 as test');
    console.log('[DB] ✅ Test query successful');

    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] ❌ Connection failed:', error);
    throw error;
  }
}

export default pool;
```

### 5. Environment Loader (server/utils/loadEnv.ts)

```typescript
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Try multiple possible .env locations
const possiblePaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../../../.env.local'),
  path.join(__dirname, '../../../../.env'),
  path.join(__dirname, '../../.env.local'),
  path.join(__dirname, '../../.env')
];

let envPath = '.env'; // fallback
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    envPath = testPath;
    break;
  }
}

console.log('[ENV] Current working directory:', process.cwd());
console.log('[ENV] Module directory:', __dirname);
console.log('[ENV] Loading environment from:', envPath);
console.log('[ENV] File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

export default envPath;
```

### 6. Firebase Admin Setup (server/middleware/authMiddleware.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import '../utils/loadEnv';

// Initialize Firebase Admin SDK
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath || !fs.existsSync(credPath)) {
  console.error('[AUTH] ❌ Firebase credentials file not found');
  console.error(`[AUTH] Expected path: ${credPath}`);
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

console.log('[AUTH] ✅ Firebase Admin SDK initialized');
console.log(`[AUTH] Project: ${credentials.project_id}`);

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid Authorization header provided'
      });
      return;
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    (req as any).user = decodedToken;

    next();
  } catch (error) {
    console.error('[AUTH] ❌ Token verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
}
```

---

## Frontend Setup

### 1. Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/your-app/',  // Must match PassengerBaseURI
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### 2. Frontend .env

```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# API Base URL (NO /api suffix!)
VITE_API_BASE_URL=https://yourdomain.com/your-app
```

### 3. Firebase Client Setup (src/services/firebase.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log('[FIREBASE] ✅ Firebase initialized');
```

### 4. API Service (src/services/api.ts)

```typescript
import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getUser: () => fetchWithAuth('/api/auth/me'),
  getCharacters: () => fetchWithAuth('/api/characters'),
  // ... other endpoints
};
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Backend compiles without errors (`npm run server:build`)
- [ ] Environment variables configured in `.env`
- [ ] Firebase service account JSON uploaded to server
- [ ] MySQL database created and schema deployed
- [ ] `app.js` entry point created
- [ ] Backend `package.json` created with production dependencies only

### Backend Deployment

1. **Compile TypeScript**:
   ```bash
   npm run server:build
   ```

2. **Flatten compiled output** (if needed):
   ```bash
   cp -r server/dist/server/* server/dist/
   ```

3. **Upload to iFastNet** via cPanel File Manager:
   ```
   server/dist/data/       → /home/username/nodejs/your-app-api/data/
   server/dist/logic/      → /home/username/nodejs/your-app-api/logic/
   server/dist/middleware/ → /home/username/nodejs/your-app-api/middleware/
   server/dist/routes/     → /home/username/nodejs/your-app-api/routes/
   server/dist/utils/      → /home/username/nodejs/your-app-api/utils/
   server/dist/index.js    → /home/username/nodejs/your-app-api/index.js
   server/dist/*.js        → /home/username/nodejs/your-app-api/*.js
   ```

4. **Upload critical files**:
   ```
   server/app.js         → /home/username/nodejs/your-app-api/app.js
   server/package.json   → /home/username/nodejs/your-app-api/package.json
   .env                  → /home/username/nodejs/your-app-api/.env
   ```

5. **Install dependencies** (cPanel Terminal):
   ```bash
   cd /home/username/nodejs/your-app-api
   npm install
   ```

6. **Configure Node.js App** in cPanel:
   - Application Root: `/home/username/nodejs/your-app-api`
   - Application URL: `/your-app`
   - Application Startup File: `app.js`
   - Node.js Version: 20.x or higher

7. **Restart** the app in cPanel

### Frontend Deployment

1. **Build frontend**:
   ```bash
   npm run build
   ```

2. **Upload to public_html**:
   ```
   dist/               → /home/username/public_html/your-app/
   ```

3. **Create .htaccess** in `/home/username/public_html/your-app/`:
   ```apache
   Header add X-HTACCESS "your-app"

   # DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
   PassengerAppRoot "/home/username/nodejs/your-app-api"
   PassengerBaseURI "/your-app"
   PassengerNodejs "/home/username/nodevenv/nodejs/your-app-api/20/bin/node"
   PassengerAppType node
   PassengerStartupFile app.js
   PassengerAppLogFile "/home/username/logs/your-app-passenger.log"
   # DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /your-app/

     RewriteRule ^api/ - [L]

     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /your-app/index.html [L]
   </IfModule>
   ```

### Post-Deployment Verification

- [ ] Check logs: `/home/username/logs/your-app-passenger.log`
- [ ] Verify environment loaded: Look for `[ENV]` logs
- [ ] Verify database connected: Look for `[DB] ✅` logs
- [ ] Verify Firebase initialized: Look for `[AUTH] ✅` logs
- [ ] Test frontend: Visit `https://yourdomain.com/your-app/`
- [ ] Test authentication: Sign in with Google/Email
- [ ] Test API endpoints: Check network tab for `/api/*` calls
- [ ] Verify data loads: Check character/data retrieval

---

## Troubleshooting Guide

### Issue: Cannot find module '/home/.../app.js'

**Cause**: `app.js` not uploaded or deleted during deployment

**Fix**: Upload `server/app.js` to app root

---

### Issue: Access denied for user ''@'localhost' (using password: NO)

**Cause**: Environment variables not loaded or database config wrong

**Debug**:
1. Check logs for `[ENV]` and `[DB]` diagnostic output
2. Verify `.env` file exists in app root
3. Check `.env` has correct DB_HOST, DB_USER, DB_PASS
4. Ensure using individual connection parameters, NOT MYSQL_URL

**Fix**: Update `loadEnv.ts` with path fallback logic (see GOTCHA #2)

---

### Issue: Firebase credentials file not found

**Cause**: GOOGLE_APPLICATION_CREDENTIALS path incorrect

**Debug**:
1. Check log shows expected path
2. Verify file exists: `ls -la /home/username/.config/firebase/`
3. Check path in `.env` is absolute, not relative

**Fix**: Use absolute path in `.env`:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/home/username/.config/firebase/firebase-service-account.json
```

---

### Issue: 404 on all API endpoints

**Cause**: `.htaccess` routing incorrect or missing

**Debug**:
1. Check `.htaccess` exists in `public_html/your-app/`
2. Verify `PassengerBaseURI` matches app path
3. Check `RewriteRule ^api/` is present

**Fix**: Update `.htaccess` (see GOTCHA #7)

---

### Issue: CORS errors

**Cause**: ALLOWED_ORIGIN not set or incorrect

**Debug**:
1. Check browser console for CORS error details
2. Verify `.env` has ALLOWED_ORIGIN
3. Check server logs for origin in request

**Fix**: Update `.env`:
```bash
ALLOWED_ORIGIN=https://yourdomain.com
```

---

### Issue: Double /api/ in URLs

**Cause**: VITE_API_BASE_URL includes `/api` suffix

**Fix**: Remove `/api` from base URL (see GOTCHA #4):
```bash
# ✅ CORRECT
VITE_API_BASE_URL=https://yourdomain.com/your-app
```

---

### Issue: Server won't start - module errors

**Cause**: Wrong module system (ES vs CommonJS)

**Debug**:
1. Check `package.json` has `"type": "commonjs"`
2. Verify `app.js` uses `require()`, not `import()`
3. Check TypeScript compiles to CommonJS

**Fix**: See GOTCHA #10

---

### Issue: Environment variables not loading

**Cause**: `.env` file in wrong location or path resolution fails

**Debug**:
1. Check logs show `[ENV] File exists: false`
2. Verify `.env` in app root: `/home/username/nodejs/your-app-api/.env`
3. Check file permissions: `chmod 644 .env`

**Fix**: Use multi-path fallback in `loadEnv.ts` (see GOTCHA #2)

---

## File Structure Reference

### Development Structure

```
project-root/
├── .env                        # Local environment variables
├── .env.production             # Production environment template
├── package.json                # Root package.json (all dependencies)
├── vite.config.ts              # Frontend build config
├── tsconfig.json               # Root TypeScript config
│
├── src/                        # Frontend source
│   ├── index.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   └── api.ts
│   └── components/
│
└── server/                     # Backend source
    ├── app.js                  # Passenger entry point
    ├── package.json            # Backend-only dependencies
    ├── tsconfig.json           # Backend TypeScript config
    ├── index.ts                # Main server file
    ├── data/
    │   ├── db-connection.ts
    │   └── *.repository.ts
    ├── logic/
    │   └── *.logic.ts
    ├── middleware/
    │   └── authMiddleware.ts
    ├── routes/
    │   └── *.routes.ts
    └── utils/
        └── loadEnv.ts
```

### Production Structure (iFastNet)

```
/home/username/
├── public_html/
│   └── your-app/               # Frontend (built from src/)
│       ├── .htaccess           # Apache/Passenger config
│       ├── index.html
│       └── assets/
│           ├── main-*.js
│           └── main-*.css
│
├── nodejs/
│   └── your-app-api/           # Backend (compiled from server/)
│       ├── .env                # Production environment variables
│       ├── app.js              # Passenger entry point
│       ├── package.json        # Backend-only dependencies
│       ├── node_modules/       # Installed dependencies
│       ├── index.js            # Compiled main server
│       ├── data/               # Compiled repositories
│       ├── logic/              # Compiled business logic
│       ├── middleware/         # Compiled middleware
│       ├── routes/             # Compiled routes
│       └── utils/              # Compiled utilities
│
├── .config/
│   └── firebase/
│       └── firebase-service-account.json
│
└── logs/
    └── your-app-passenger.log  # Passenger application logs
```

---

## Build Scripts Reference

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "server:dev": "tsx watch server/index.ts",
    "server:build": "tsc -p server/tsconfig.json",
    "deploy": "npm run build && npm run server:build"
  }
}
```

### Deployment Automation Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

# Build frontend and backend
echo "Building frontend..."
npm run build

echo "Building backend..."
npm run server:build

# Flatten backend output
echo "Flattening backend structure..."
cp -r server/dist/server/* server/dist/

echo "✅ Build complete!"
echo "📦 Frontend: dist/"
echo "📦 Backend: server/dist/"
echo ""
echo "Next steps:"
echo "1. Upload dist/ to public_html/your-app/"
echo "2. Upload server/dist/ contents to nodejs/your-app-api/"
echo "3. Upload server/app.js to nodejs/your-app-api/"
echo "4. Upload server/package.json to nodejs/your-app-api/"
echo "5. Upload .env to nodejs/your-app-api/"
echo "6. Run 'npm install' in cPanel terminal"
echo "7. Restart app in cPanel Node.js manager"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

---

## Expected Log Output

### Successful Startup

```
[ENV] Current working directory: /home/username/nodejs/your-app-api
[ENV] Module directory: /home/username/nodejs/your-app-api/utils
[ENV] Loading environment from: /home/username/nodejs/your-app-api/.env
[ENV] File exists: true
[BOOT] Starting Your App API...
[BOOT] Environment: Passenger (iFastNet)
[BOOT] Node version: v20.19.4
[BOOT] PASSENGER_BASE_URI: /your-app
[BOOT] PASSENGER_APP_ENV: production
[AUTH] ✅ Firebase Admin SDK initialized
[AUTH] Project: your-project-id
[DB] Initializing connection pool...
[DB] Host: 31.22.4.44
[DB] Port: 3306
[DB] Database: your_database
[DB] User: your_user
[DB] Password: ***SET***
[PASSENGER] Server started successfully
[BOOT] ✅ Server listening on port 3000
[BOOT] Mode: Passenger managed
[BOOT] Health check: http://localhost:3000/healthz
[BOOT] Passenger will handle process lifecycle
[BOOT] Base URI: /your-app
```

### Successful Request

```
[REQUEST] GET /your-app/api/auth/me from yourdomain.com
[PATH] Normalized: /your-app/api/auth/me → /api/auth/me
[AUTH] ✅ Authenticated: user@example.com (ID: 1, Admin: false)
```

---

## Security Best Practices

1. **Never commit sensitive files**:
   - `.env` (add to `.gitignore`)
   - `firebase-service-account.json`
   - Database credentials

2. **Use environment variables** for all secrets

3. **Set proper file permissions**:
   ```bash
   chmod 600 .env
   chmod 600 firebase-service-account.json
   ```

4. **Enable HTTPS** (usually automatic on iFastNet)

5. **Validate all inputs** server-side

6. **Use Firebase Auth** for authentication, never roll your own

7. **Sanitize database queries** (use parameterized queries)

8. **Keep dependencies updated**:
   ```bash
   npm audit
   npm update
   ```

---

## Performance Tips

1. **Connection pooling**: Use `mysql2/promise` with connection pool (already configured)

2. **Frontend optimization**:
   - Enable gzip compression (automatic on Apache)
   - Use code splitting with dynamic imports
   - Lazy load routes and components

3. **Backend optimization**:
   - Cache Firebase token validation (short TTL)
   - Use database indexes for frequent queries
   - Implement query result caching for expensive operations

4. **Resource limits** (iFastNet shared hosting):
   - Connection limit: 10 concurrent MySQL connections
   - Memory: ~512MB per process
   - CPU: Shared, avoid long-running synchronous operations

---

## Common Commands Reference

### cPanel Terminal

```bash
# Navigate to app
cd /home/username/nodejs/your-app-api

# Install dependencies
npm install

# Check environment
cat .env

# View logs
tail -f /home/username/logs/your-app-passenger.log

# Restart app (touch tmp/restart.txt in app root)
mkdir -p tmp && touch tmp/restart.txt

# Check Node version
node --version

# Check file permissions
ls -la

# Test database connection
mysql -h 31.22.4.44 -u your_user -p your_database
```

### Local Development

```bash
# Start frontend dev server
npm run dev

# Start backend dev server
npm run server:dev

# Build for production
npm run build
npm run server:build

# Preview production build
npm run preview
```

---

## Helpful Resources

- **iFastNet Documentation**: https://ifastnet.com/docs/
- **Phusion Passenger**: https://www.phusionpassenger.com/library/
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **mysql2 Documentation**: https://github.com/sidorares/node-mysql2
- **Vite Documentation**: https://vitejs.dev/

---

## Version History

- **1.0.0** (2024-11-08): Initial version based on Forgesteel deployment experience

---

## License

This guide is provided as-is for educational purposes. Adapt to your specific project needs.
