import { createLogger, format, transports } from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our custom colors
import winston from 'winston';
winston.addColors(colors);

// Define which log level to use based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Create custom format for logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.errors({ stack: true }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create the logger
export const logger = createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    
    // File transport for all logs
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'all.log'),
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    }),
    
    // File transport for error logs only
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    }),
  ],
});

// HTTP request logging middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';
    
    logger.log(logLevel, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

// Structured logging helpers
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info({
    message,
    ...context
  });
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn({
    message,
    ...context
  });
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug({
    message,
    ...context
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration: number, success: boolean, error?: Error) => {
  const logLevel = success ? 'debug' : 'error';
  logger.log(logLevel, {
    message: `Database ${operation} on ${table}`,
    operation,
    table,
    duration: `${duration}ms`,
    success,
    error: error?.message
  });
};

// Security event logging
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn({
    message: `Security Event: ${event}`,
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Performance monitoring
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  const logLevel = duration > 1000 ? 'warn' : 'debug'; // Warn for operations > 1s
  logger.log(logLevel, {
    message: `Performance: ${operation}`,
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Business logic logging
export const logBusinessEvent = (event: string, userId: string, details: Record<string, any>) => {
  logger.info({
    message: `Business Event: ${event}`,
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}