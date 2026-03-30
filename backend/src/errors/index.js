import { v4 as uuidv4 } from 'uuid';

// Base Error Class
class BaseError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.traceId = uuidv4();
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      trace_id: this.traceId,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// Operational Errors (4xx)
class ValidationError extends BaseError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends BaseError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends BaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends BaseError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Programmer Errors (5xx)
class DatabaseError extends BaseError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', false);
    this.originalError = originalError;
  }
}

class ExternalServiceError extends BaseError {
  constructor(service, message) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

class MediaUploadError extends BaseError {
  constructor(message, reason = null) {
    super(message, 422, 'MEDIA_UPLOAD_ERROR');
    this.reason = reason;
  }
}

class InsufficientStorageError extends BaseError {
  constructor(message = 'Insufficient storage space') {
    super(message, 507, 'INSUFFICIENT_STORAGE');
  }
}

class CircuitBreakerOpenError extends BaseError {
  constructor(service) {
    super(`Circuit breaker is open for ${service}`, 503, 'CIRCUIT_BREAKER_OPEN');
    this.service = service;
  }
}

// Gallery-specific Errors
class GalleryPostNotFoundError extends NotFoundError {
  constructor() {
    super('Gallery post');
  }
}

class GalleryCommentError extends BaseError {
  constructor(message, action = 'comment') {
    super(`Failed to ${action}: ${message}`, 400, 'GALLERY_COMMENT_ERROR');
  }
}

class GalleryReactionError extends BaseError {
  constructor(message, reactionType = null) {
    super(`Failed to add reaction: ${message}`, 400, 'GALLERY_REACTION_ERROR');
    this.reactionType = reactionType;
  }
}

class GalleryUploadError extends MediaUploadError {
  constructor(message, fileDetails = null) {
    super(`Gallery upload failed: ${message}`);
    this.fileDetails = fileDetails;
  }
}

class SupabaseConnectionError extends ExternalServiceError {
  constructor(message) {
    super('Supabase', message);
  }
}

class SQLiteConnectionError extends DatabaseError {
  constructor(message) {
    super(`SQLite connection failed: ${message}`);
  }
}

export {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  MediaUploadError,
  InsufficientStorageError,
  CircuitBreakerOpenError,
  GalleryPostNotFoundError,
  GalleryCommentError,
  GalleryReactionError,
  GalleryUploadError,
  SupabaseConnectionError,
  SQLiteConnectionError
};
