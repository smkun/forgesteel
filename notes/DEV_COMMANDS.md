# Development & Deployment Commands

Quick reference for running and building the Forgesteel Draachenmar application.

---

## 🚀 Development

### Frontend Development Server

Start the Vite development server:

```bash
npm run start
```

- **URL**: `http://localhost:5173/forgesteel/`
- **Features**: Hot module replacement, fast refresh
- **Port**: 5173 (default Vite port)
- **Proxy**: Automatically proxies `/api` requests to backend at `localhost:4000`

### Backend API Development Server

Start the Express backend server with hot-reloading:

```bash
npm run server:dev
```

- **URL**: `http://localhost:4000`
- **API Endpoints**: `http://localhost:4000/api/*`
- **Features**: Auto-restart on file changes (via nodemon/tsx watch)
- **Port**: 4000

### Running Both Servers

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
npm run server:dev
```

**Terminal 2 - Frontend:**

```bash
npm run start
```

The frontend will automatically proxy API requests to the backend.

---

## 🏗️ Production Build

### Build Frontend

Build the frontend for production:

```bash
npm run build
```

**Output**: `distribution/frontend/`

**What it does**:

- Compiles TypeScript
- Bundles with Vite
- Minifies JavaScript and CSS
- Optimizes assets
- Generates production-ready static files

**Alternative commands**:

```bash
npm run build:frontend  # Same as npm run build
```

### Build Backend

Build the backend for production:

```bash
npm run build:backend
```

**Output**: `distribution/backend/`

**What it does**:

- Compiles TypeScript to JavaScript
- Copies necessary files
- Prepares server for deployment

**Alternative commands**:

```bash
npm run server:build  # Same as npm run build:backend
```

### Build Everything

Build both frontend and backend:

```bash
npm run build:frontend && npm run build:backend
```

---

## 🌐 Production Deployment

### Start Production Backend

After building, start the production backend:

```bash
npm run server:start
```

- Runs the compiled backend from `distribution/backend/`
- Uses production environment variables
- Port configured via `PORT` environment variable (default: 4000)

### Deploy Frontend

The frontend build in `distribution/frontend/` is static and can be deployed to:

- Apache/Nginx web server
- Static hosting (iFastNet, Netlify, Vercel, etc.)
- CDN

**Current deployment**: iFastNet with `.htaccess` configuration

---

## 📝 Complete Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Deploy database schema (if needed)
npm run deploy-schema
```

### Daily Development

```bash
# Terminal 1 - Start backend
npm run server:dev

# Terminal 2 - Start frontend
npm run start
```

### Before Committing

```bash
# Run linter
npm run lint

# Build to check for errors
npm run build:frontend
npm run build:backend
```

### Deployment

```bash
# Build everything
npm run build:frontend
npm run build:backend

# Deploy frontend files
# Copy distribution/frontend/* to web server

# Deploy backend
# Copy distribution/backend/* to server
# Set environment variables
# Start with npm run server:start
```

---

## 🔧 Additional Commands

### Testing API Endpoints

```bash
# Run API endpoint tests
./server/test-api-endpoints.sh
```

### Database Schema Deployment

```bash
# Deploy database schema
npm run deploy-schema

# Simple schema deployment
npm run deploy-schema:simple
```

### Linting

```bash
# Run ESLint
npm run lint
```

### Development Proxy

The frontend dev server (`npm run start`) automatically proxies API requests:

- Frontend: `http://localhost:5173/forgesteel/api/*`
- → Backend: `http://localhost:4000/api/*`

Configured in `vite.config.ts` (lines 70-89).

---

## 📦 Package.json Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `vite --host` | Start frontend dev server |
| `build` | `tsc && vite build` | Build frontend for production |
| `build:frontend` | `tsc && vite build` | Build frontend (alias) |
| `build:backend` | Build backend TypeScript | Compile backend for production |
| `server:dev` | Start backend with watch | Run backend dev server |
| `server:build` | Compile backend | Build backend (alias) |
| `server:start` | Start production backend | Run compiled backend |
| `lint` | `eslint .` | Run linter |
| `deploy-schema` | Deploy database schema | Set up MySQL database |
| `deploy-schema:simple` | Simple schema deploy | Minimal database setup |

---

## 🌍 Environment Variables

### Frontend

Set in browser or `.env.local`:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

### Backend

Set in `.env` or environment:

```bash
PORT=4000
DB_HOST=localhost
DB_USER=forgesteel
DB_PASSWORD=your_password
DB_NAME=forgesteel_db
FIREBASE_ADMIN_CREDENTIALS=path/to/serviceAccount.json
```

---

## 🎯 Quick Start Cheatsheet

```bash
# Development (both servers)
npm run server:dev  # Terminal 1
npm run start       # Terminal 2

# Production build
npm run build:frontend
npm run build:backend

# Production run
npm run server:start  # Backend only
# Frontend: Deploy distribution/frontend/ to web server
```

---

**Last Updated**: 2025-11-09
**Project**: Forgesteel Draachenmar
**Architecture**: React (Vite) + Express + MySQL
