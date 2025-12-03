"use strict";
/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error response formatting across all API endpoints.
 *
 * References:
 * - PLANNING.md: Error handling strategy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.createError = createError;
exports.asyncHandler = asyncHandler;
/**
 * Custom application error class
 *
 * Extends Error with HTTP status code and optional details
 */
class AppError extends Error {
    statusCode;
    message;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Error Handler Middleware
 *
 * Catches all errors thrown in route handlers and formats them
 * into consistent JSON responses.
 *
 * Usage:
 * ```typescript
 * app.use(errorHandler); // Register as last middleware
 * ```
 *
 * @param err Error object
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function errorHandler(err, req, res, next) {
    // Log error for debugging
    console.error('[ERROR]', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });
    // Determine status code
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    // Build error response
    const errorResponse = {
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred',
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path
    };
    // Include additional details in development
    if (process.env.NODE_ENV === 'development' && err instanceof AppError) {
        errorResponse.details = err.details;
    }
    // Send response
    res.status(statusCode).json(errorResponse);
}
/**
 * Helper function to create AppError instances
 *
 * Usage:
 * ```typescript
 * throw createError(404, 'Character not found', { characterId: 123 });
 * ```
 */
function createError(statusCode, message, details) {
    return new AppError(statusCode, message, details);
}
/**
 * Async error wrapper
 *
 * Wraps async route handlers to automatically catch and forward errors.
 *
 * Usage:
 * ```typescript
 * app.get('/api/data', asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   res.json(data);
 * }));
 * ```
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map