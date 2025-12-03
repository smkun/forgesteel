/**
 * Passenger Entry Point Wrapper (CommonJS)
 *
 * iFastNet Phusion Passenger expects app.js in the app root.
 * This bootstraps the compiled backend at index.cjs.
 */

try {
  require('./index.cjs');
  console.log('[PASSENGER] Server started successfully');
} catch (err) {
  console.error('[PASSENGER] Failed to start server:', err);
  process.exit(1);
}
