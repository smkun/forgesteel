/**
 * Forgesteel Backend API Server
 *
 * Express server with Passenger deployment support for iFastNet shared hosting.
 * Handles Firebase authentication and character storage in MySQL database.
 *
 * References:
 * - PRD.md: Product requirements
 * - PLANNING.md: Technical architecture
 * - PASSENGER_DEPLOYMENT_GUIDE.md: iFastNet deployment patterns
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ================================================================
// PASSENGER ENVIRONMENT DETECTION
// ================================================================

/**
 * Detect if running under Phusion Passenger
 * Passenger sets PASSENGER_BASE_URI and PASSENGER_APP_ENV
 */
const isPassenger = !!(
  process.env.PASSENGER_BASE_URI ||
  process.env.PASSENGER_APP_ENV
);

console.log(`[BOOT] Starting Forgesteel API...`);
console.log(`[BOOT] Environment: ${isPassenger ? 'Passenger (iFastNet)' : 'Local Development'}`);
console.log(`[BOOT] Node version: ${process.version}`);
console.log(`[BOOT] PASSENGER_BASE_URI: ${process.env.PASSENGER_BASE_URI || 'not set'}`);
console.log(`[BOOT] PASSENGER_APP_ENV: ${process.env.PASSENGER_APP_ENV || 'not set'}`);

// ================================================================
// EXPRESS APP INITIALIZATION
// ================================================================

const app = express();

// ================================================================
// MIDDLEWARE SETUP
// ================================================================

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '16mb' })); // Character JSON with images can be large
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.url} from ${req.headers.host}`);
  next();
});

// ================================================================
// PASSENGER PATH NORMALIZATION MIDDLEWARE
// ================================================================

/**
 * Strip PASSENGER_BASE_URI from request paths
 *
 * Critical for iFastNet Passenger deployment:
 * - Passenger sets PASSENGER_BASE_URI (e.g., "/forgesteel/api")
 * - Does NOT strip it from req.url automatically
 * - Express routes won't match unless we normalize
 *
 * Example:
 *   Incoming: /forgesteel/api/characters
 *   After normalization: /characters
 *   Express route matches: app.get('/characters', ...)
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const baseUri = process.env.PASSENGER_BASE_URI || '';

  if (baseUri && req.url.startsWith(baseUri)) {
    req.url = req.url.slice(baseUri.length) || '/';
    console.log(`[PATH] Normalized: ${baseUri}${req.url} → ${req.url}`);
  }

  next();
});

// ================================================================
// HEALTH CHECK ENDPOINTS
// ================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'forgesteel-api',
    environment: isPassenger ? 'passenger' : 'local',
    baseUri: process.env.PASSENGER_BASE_URI || 'none',
    node: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: isPassenger ? 'passenger' : 'local',
    baseUri: process.env.PASSENGER_BASE_URI || 'none',
    node: process.version,
    uptime: process.uptime()
  });
});

// ================================================================
// API ROUTES (TODO: Implement in Milestone 2-3)
// ================================================================

// Auth routes will go here
// app.use('/api/auth', authRoutes);

// Character routes will go here
// app.use('/api/characters', charactersRoutes);

// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    path: req.url
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// ================================================================
// SERVER STARTUP
// ================================================================

/**
 * Intelligent port selection
 *
 * Passenger mode (iFastNet):
 *   - Uses port 3000 (or process.env.PORT if set by Passenger)
 *   - Passenger manages the socket connection
 *
 * Local development:
 *   - Uses port 4000 (avoids conflict with Vite on 5173)
 *   - Can override with process.env.PORT
 *
 * CRITICAL: Do NOT set PORT in .env for Passenger deployments
 * Reference: PASSENGER_DEPLOYMENT_GUIDE.md section "Common Pitfalls"
 */
const PORT = isPassenger
  ? Number(process.env.PORT || 3000)
  : Number(process.env.PORT || 4000);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[BOOT] ✅ Server listening on port ${PORT}`);
  console.log(`[BOOT] Mode: ${isPassenger ? 'Passenger managed' : 'Local development'}`);
  console.log(`[BOOT] Health check: http://localhost:${PORT}/healthz`);

  if (isPassenger) {
    console.log(`[BOOT] Passenger will handle process lifecycle`);
    console.log(`[BOOT] Base URI: ${process.env.PASSENGER_BASE_URI || 'none'}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

export default app;
