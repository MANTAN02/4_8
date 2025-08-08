import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logError, logSecurityEvent } from './logger';
import { DatabaseError } from 'pg';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTH_REQUIRED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed') {
    super(message, 503, true, 'DATABASE_CONNECTION_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service unavailable') {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

// Sanitize error message for production
const sanitizeErrorMessage = (error: Error, isProduction: boolean): string => {
  if (!isProduction) {
    return error.message;
  }

  // In production, return generic messages for non-operational errors
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }

  // Generic message for unexpected errors
  return 'An unexpected error occurred. Please try again later.';
};

// Handle Zod validation errors
const handleZodError = (error: ZodError): ValidationError => {
  const messages = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  
  return new ValidationError(`Validation failed: ${messages.join(', ')}`, 'VALIDATION_ERROR');
};

// Handle database errors
const handleDatabaseError = (error: DatabaseError): AppError => {
  logError(error, { type: 'DATABASE_ERROR', code: error.code });

  switch (error.code) {
    case '23505': // Unique violation
      return new ConflictError('Resource already exists');
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null violation
      return new ValidationError('Required field is missing');
    case '42703': // Undefined column
      return new ValidationError('Invalid field specified');
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
      return new DatabaseConnectionError('Database is temporarily unavailable');
    default:
      return new AppError('Database operation failed', 500, false, 'DATABASE_ERROR');
  }
};

// Handle JWT errors
const handleJWTError = (error: Error): AuthenticationError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  return new AuthenticationError('Authentication failed');
};

// Security event detection
const detectSecurityEvent = (error: Error, req: Request): void => {
  const suspiciousPatterns = [
    /script/i,
    /union.*select/i,
    /drop.*table/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];

  const userInput = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userInput));

  if (isSuspicious || error.message.includes('SQL injection') || error.message.includes('XSS')) {
    logSecurityEvent('SUSPICIOUS_REQUEST', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      error: error.message,
      userId: (req as any).user?.id || 'anonymous'
    });
  }
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Performance monitoring wrapper
export const withPerformanceMonitoring = (name: string) => {
  return (fn: Function) => {
    return async (...args: any[]) => {
      const start = Date.now();
      try {
        const result = await fn(...args);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          logError(new Error(`Slow operation detected: ${name}`), {
            operation: name,
            duration: `${duration}ms`,
            type: 'PERFORMANCE_WARNING'
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logError(error as Error, {
          operation: name,
          duration: `${duration}ms`,
          type: 'OPERATION_FAILED'
        });
        throw error;
      }
    };
  };
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;

  // Detect potential security events
  detectSecurityEvent(error, req);

  let appError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name && ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name)) {
    appError = handleJWTError(error);
  } else if ('code' in error && typeof error.code === 'string') {
    appError = handleDatabaseError(error as DatabaseError);
  } else {
    // Unexpected error
    appError = new AppError(
      'An unexpected error occurred',
      500,
      false,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Log the error with context
  logError(error, {
    requestId,
    userId: (req as any).user?.id || 'anonymous',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: appError.statusCode,
    isOperational: appError.isOperational
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: sanitizeErrorMessage(appError, isProduction),
      code: appError.code,
      statusCode: appError.statusCode,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Add details in development
  if (!isProduction && !appError.isOperational) {
    errorResponse.error.details = {
      stack: error.stack,
      originalMessage: error.message
    };
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// Unhandled rejection handler
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
  logError(new Error('Unhandled Promise Rejection'), {
    reason: reason?.message || reason,
    type: 'UNHANDLED_REJECTION'
  });
  
  // In production, we might want to exit gracefully
  if (process.env.NODE_ENV === 'production') {
    console.error('Unhandled Promise Rejection. Shutting down gracefully...');
    process.exit(1);
  }
};

// Uncaught exception handler
export const uncaughtExceptionHandler = (error: Error) => {
  logError(error, {
    type: 'UNCAUGHT_EXCEPTION'
  });
  
  console.error('Uncaught Exception. Shutting down...');
  process.exit(1);
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    logError(new Error(`Received ${signal}. Starting graceful shutdown...`), {
      type: 'GRACEFUL_SHUTDOWN',
      signal
    });

    server.close(() => {
      console.log('Server closed. Exiting process...');
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};