/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error response formatting across all API endpoints.
 *
 * References:
 * - PLANNING.md: Error handling strategy
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

/**
 * Custom application error class
 *
 * Extends Error with HTTP status code and optional details
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

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
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
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
  const errorResponse: ErrorResponse = {
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
export function createError(
  statusCode: number,
  message: string,
  details?: any
): AppError {
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
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
