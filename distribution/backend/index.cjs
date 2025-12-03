"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
require('./utils/loadEnv.cjs');
// ================================================================
// PASSENGER ENVIRONMENT DETECTION
// ================================================================
/**
 * Detect if running under Phusion Passenger
 * Passenger sets PASSENGER_BASE_URI and PASSENGER_APP_ENV
 */
const isPassenger = !!(process.env.PASSENGER_BASE_URI ||
    process.env.PASSENGER_APP_ENV);
console.log('[BOOT] Starting Forgesteel API...');
console.log(`[BOOT] Environment: ${isPassenger ? 'Passenger (iFastNet)' : 'Local Development'}`);
console.log(`[BOOT] Node version: ${process.version}`);
console.log(`[BOOT] PASSENGER_BASE_URI: ${process.env.PASSENGER_BASE_URI || 'not set'}`);
console.log(`[BOOT] PASSENGER_APP_ENV: ${process.env.PASSENGER_APP_ENV || 'not set'}`);
// ================================================================
// EXPRESS APP INITIALIZATION
// ================================================================
const app = (0, express_1.default)();
// ================================================================
// MIDDLEWARE SETUP
// ================================================================
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:4173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsers
app.use(express_1.default.json({ limit: '16mb' })); // Character JSON with images can be large
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
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
app.use((req, res, next) => {
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
app.get('/', (req, res) => {
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
app.get('/healthz', (req, res) => {
    res.json({
        status: 'ok',
        environment: isPassenger ? 'passenger' : 'local',
        baseUri: process.env.PASSENGER_BASE_URI || 'none',
        node: process.version,
        uptime: process.uptime()
    });
});
// ================================================================
// API ROUTES
// ================================================================
const auth_routes_1 = __importDefault(require('./routes/auth.routes.cjs'));
const character_routes_1 = __importDefault(require('./routes/character.routes.cjs'));
const campaign_routes_1 = __importDefault(require('./routes/campaign.routes.cjs'));
const project_routes_1 = __importDefault(require('./routes/project.routes.cjs'));
const admin_routes_1 = __importDefault(require('./routes/admin.routes.cjs'));
const user_routes_1 = __importDefault(require('./routes/user.routes.cjs'));
const errorHandler_1 = require('./middleware/errorHandler.cjs');
// Auth routes
app.use('/api/auth', auth_routes_1.default);
// Character routes
app.use('/api/characters', character_routes_1.default);
// Campaign routes
app.use('/api/campaigns', campaign_routes_1.default);
// Project routes (nested under campaigns)
app.use('/api/campaigns/:campaignId/projects', project_routes_1.default);
// Admin routes
app.use('/api/admin', admin_routes_1.default);
// User routes
app.use('/api/users', user_routes_1.default);
// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        path: req.url
    });
});
// Centralized error handler (must be last)
app.use(errorHandler_1.errorHandler);
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
const server = http_1.default.createServer(app);
server.listen(PORT, () => {
    console.log(`[BOOT] ✅ Server listening on port ${PORT}`);
    console.log(`[BOOT] Mode: ${isPassenger ? 'Passenger managed' : 'Local development'}`);
    console.log(`[BOOT] Health check: http://localhost:${PORT}/healthz`);
    if (isPassenger) {
        console.log('[BOOT] Passenger will handle process lifecycle');
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
exports.default = app;
//# sourceMappingURL=index.js.map