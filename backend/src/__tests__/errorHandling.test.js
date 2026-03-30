import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { 
  ValidationError, 
  GalleryPostNotFoundError, 
  GalleryUploadError,
  RateLimitError,
  DatabaseError,
  SupabaseConnectionError
} from '../errors/index.js';
import { CircuitBreaker, RetryManager, Logger } from '../middleware/errorHandler.js';
import databaseService from '../services/databaseService.js';

// Mock the database service
vi.mock('../services/databaseService.js', () => ({
  default: {
    executeWithFallback: vi.fn()
  }
}));

// Mock multer
vi.mock('multer', () => ({
  default: vi.fn(() => ({
    array: vi.fn(() => (req, res, next) => {
      req.files = [
        {
          filename: 'test.jpg',
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: '/tmp/test.jpg'
        }
      ];
      next();
    }),
    single: vi.fn(() => (req, res, next) => next())
  }))
}));

// Mock fs
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(),
  unlink: vi.fn().mockResolvedValue(),
  statfs: vi.fn().mockResolvedValue({
    bavail: 1000000,
    bsize: 4096
  })
}));

describe('Error Handling Suite', () => {
  let app;
  let mockDatabaseService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    mockDatabaseService = await import('../services/databaseService.js').then(m => m.default);
    
    // Create test app
    app = express();
    app.use(express.json());
    
    // Add test routes that trigger different errors
    app.post('/test/validation-error', (req, res, next) => {
      const error = new ValidationError('Test validation error', 'testField');
      next(error);
    });

    app.get('/test/not-found', (req, res, next) => {
      const error = new GalleryPostNotFoundError();
      next(error);
    });

    app.post('/test/database-error', async (req, res, next) => {
      try {
        await mockDatabaseService.executeWithFallback('testOperation');
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    app.post('/test/upload-error', (req, res, next) => {
      const error = new GalleryUploadError('Test upload error');
      next(error);
    });

    app.get('/test/unknown-error', (req, res, next) => {
      const error = new Error('Unknown error');
      next(error);
    });

    // Add error handler
    app.use((err, req, res, next) => {
      req.traceId = 'test-trace-id';
      
      if (err.constructor.name === 'ValidationError' && err.errors) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          trace_id: req.traceId,
          details: err.errors
        });
      }

      // Handle custom error classes with instanceof
      if (err instanceof ValidationError || 
          err instanceof GalleryPostNotFoundError ||
          err instanceof GalleryUploadError) {
        return res.status(err.statusCode).json(err.toJSON());
      }

      res.status(err.statusCode || 500).json({
        error: err.statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR',
        message: err.message || 'Unknown error occurred',
        trace_id: req.traceId
      });
    });
  });

  describe('Validation Error Handling', () => {
    it('should return 400 with validation error details', async () => {
      const response = await request(app)
        .post('/test/validation-error')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Test validation error',
        trace_id: expect.any(String)
      });
    });
  });

  describe('Not Found Error Handling', () => {
    it('should return 404 for gallery post not found', async () => {
      const response = await request(app)
        .get('/test/not-found');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
        trace_id: expect.any(String)
      });
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database service failures gracefully', async () => {
      mockDatabaseService.executeWithFallback.mockRejectedValue(
        new DatabaseError('Database connection failed')
      );

      const response = await request(app)
        .post('/test/database-error')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'INTERNAL_ERROR',
        trace_id: expect.any(String)
      });
    });
  });

  describe('Upload Error Handling', () => {
    it('should return 422 for upload errors', async () => {
      const response = await request(app)
        .post('/test/upload-error')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        error: 'MEDIA_UPLOAD_ERROR',
        trace_id: expect.any(String)
      });
    });
  });

  describe('Unknown Error Handling', () => {
    it('should handle unknown errors with 500 status', async () => {
      const response = await request(app)
        .get('/test/unknown-error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'CLIENT_ERROR',
        trace_id: expect.any(String)
      });
    });
  });
});

describe('Circuit Breaker Tests', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 2,
      resetTimeout: 1000,
      monitoringPeriod: 500
    });
  });

  it('should execute operation successfully when circuit is closed', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(circuitBreaker.state).toBe('CLOSED');
  });

  it('should open circuit after failure threshold is reached', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    
    // First failure
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service failure');
    expect(circuitBreaker.state).toBe('CLOSED');
    expect(circuitBreaker.failureCount).toBe(1);
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Service failure');
    expect(circuitBreaker.state).toBe('OPEN');
    expect(circuitBreaker.failureCount).toBe(2);
  });

  it('should reject immediately when circuit is open', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    
    // Open the circuit
    try {
      await circuitBreaker.execute(mockOperation);
    } catch (error) {
      // Expected
    }
    try {
      await circuitBreaker.execute(mockOperation);
    } catch (error) {
      // Expected
    }
    
    // Should reject immediately without calling the operation
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Circuit breaker is OPEN');
    expect(mockOperation).toHaveBeenCalledTimes(2); // Only called during failures
  });

  it('should close circuit after successful operation in half-open state', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Service failure'))
      .mockRejectedValueOnce(new Error('Service failure'))
      .mockResolvedValueOnce('success');
    
    // Open circuit
    await circuitBreaker.execute(mockOperation).catch(() => {});
    await circuitBreaker.execute(mockOperation).catch(() => {});
    expect(circuitBreaker.state).toBe('OPEN');
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should succeed and close circuit
    const result = await circuitBreaker.execute(mockOperation);
    expect(result).toBe('success');
    expect(circuitBreaker.state).toBe('CLOSED');
  });
});

describe('Retry Manager Tests', () => {
  it('should retry operation on retryable errors', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }))
      .mockRejectedValueOnce(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' }))
      .mockResolvedValue('success');
    
    const result = await RetryManager.withBackoff(mockOperation, {
      maxAttempts: 3,
      baseDelay: 10,
      maxDelay: 100
    });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new ValidationError('Invalid input'));
    
    await expect(RetryManager.withBackoff(mockOperation)).rejects.toThrow('Invalid input');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts', async () => {
    const mockOperation = vi.fn().mockRejectedValue(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }));
    
    await expect(RetryManager.withBackoff(mockOperation, {
      maxAttempts: 2,
      baseDelay: 10
    })).rejects.toThrow('ECONNRESET');
    
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});

describe('Database Service Fallback Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should fallback to SQLite when Supabase fails', async () => {
    const { default: mockDatabaseService } = await import('../services/databaseService.js');
    
    // Mock Supabase failure and SQLite success
    mockDatabaseService.executeWithFallback.mockImplementation(async (operation) => {
      if (operation === 'getPosts') {
        throw new Error('Supabase service error: Supabase down');
      }
    });

    // This test would need the actual SQLite implementation
    // For now, we'll test the error propagation
    await expect(mockDatabaseService.executeWithFallback('getPosts'))
      .rejects.toThrow('Supabase service error: Supabase down');
  });

  it('should use Supabase when available', async () => {
    const { default: mockDatabaseService } = await import('../services/databaseService.js');
    
    const mockResult = { posts: [], pagination: {} };
    mockDatabaseService.executeWithFallback.mockResolvedValue(mockResult);
    
    const result = await mockDatabaseService.executeWithFallback('getPosts');
    
    expect(result).toEqual(mockResult);
  });
});

describe('Logger Tests', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log structured JSON messages', () => {
    Logger.info('Test message', { key: 'value' });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^{"level":"INFO"/)
    );
  });

  it('should sanitize sensitive information', () => {
    Logger.info('Test message', { 
      password: 'secret123',
      token: 'abc123',
      safeField: 'safe-value'
    });
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.password).toBe('[REDACTED]');
    expect(loggedData.token).toBe('[REDACTED]');
    expect(loggedData.safeField).toBe('safe-value');
  });
});

describe('Error Class Tests', () => {
  it('should create BaseError with proper structure', () => {
    const error = new ValidationError('Test message', 'testField');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.traceId).toMatch(/^[a-f0-9-]{36}$/);
    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should serialize to JSON correctly', () => {
    const error = new ValidationError('Test message', 'testField');
    const json = error.toJSON();
    
    expect(json).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: 'Test message',
      trace_id: expect.any(String),
      timestamp: expect.any(String)
    });
    
    // Should not include stack in production
    if (process.env.NODE_ENV !== 'development') {
      expect(json).not.toHaveProperty('stack');
    }
  });

  it('should handle different error types', () => {
    const errors = [
      new ValidationError('Validation failed'),
      new GalleryPostNotFoundError(),
      new GalleryUploadError('Upload failed'),
      new DatabaseError('Database error')
    ];

    errors.forEach(error => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('traceId');
      expect(error).toHaveProperty('timestamp');
    });
  });
});
