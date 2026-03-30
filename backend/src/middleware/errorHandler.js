import { BaseError } from '../errors/index.js';

// Structured Logger
class Logger {
  static log(level, message, meta = {}) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      trace_id: meta.trace_id || 'N/A',
      ...this.sanitizeMeta(meta)
    };

    console.log(JSON.stringify(logEntry));
  }

  static info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  static error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  static sanitizeMeta(meta) {
    const sanitized = { ...meta };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'authorization'];
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    // Remove stack traces in production
    if (process.env.NODE_ENV === 'production') {
      delete sanitized.stack;
    }

    return sanitized;
  }
}

// Circuit Breaker
class CircuitBreaker {
  constructor(service, options = {}) {
    this.service = service;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        Logger.warn(`Circuit breaker for ${this.service} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.service}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      Logger.info(`Circuit breaker for ${this.service} CLOSED after successful request`);
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      Logger.error(`Circuit breaker for ${this.service} OPENED after ${this.failureCount} failures`);
    }
  }
}

// Retry with Exponential Backoff
class RetryManager {
  static async withBackoff(operation, options = {}) {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = (error) => this.isRetryableError(error)
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }

        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        Logger.warn(`Retrying operation (attempt ${attempt}/${maxAttempts}) after ${delay}ms`, {
          error: error.message,
          attempt,
          delay
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  static isRetryableError(error) {
    // Retry on network errors and 5xx errors
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           (error.statusCode >= 500 && error.statusCode < 600) ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const traceId = req.traceId || 'N/A';
  
  // Log the error
  Logger.error('Request error', {
    trace_id: traceId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: err.message,
    stack: err.stack,
    isOperational: err.isOperational
  });

  // Handle different error types
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle validation errors
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      trace_id: traceId,
      details: err.errors
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'Invalid token',
      trace_id: traceId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'Token expired',
      trace_id: traceId
    });
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds limit',
      trace_id: traceId
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'TOO_MANY_FILES',
      message: 'Too many files uploaded',
      trace_id: traceId
    });
  }

  // Handle database connection errors
  if (err.code === 'SQLITE_CANTOPEN' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Database temporarily unavailable',
      trace_id: traceId
    });
  }

  // Default error response - check if error has statusCode
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Unknown error occurred';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR',
    message,
    trace_id: traceId
  });
};

// Request ID Middleware
const requestTracker = (req, res, next) => {
  req.traceId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.traceId);
  
  Logger.info('Request started', {
    trace_id: req.traceId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  next();
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export {
  Logger,
  CircuitBreaker,
  RetryManager,
  errorHandler,
  requestTracker,
  asyncHandler
};
