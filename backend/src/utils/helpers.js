import crypto from 'crypto';

// Get client information from request
export const getClientInfo = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress || req.socket.remoteAddress;
  
  return {
    ip: ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || 'unknown',
  };
};

// Generate session ID for tracking
export const generateSessionId = (req) => {
  // Try to get existing session ID from various sources
  const sessionId = req.headers['x-session-id'] || 
                   req.cookies?.sessionId || 
                   req.query?.sessionId ||
                   crypto.createHash('sha256')
                     .update(`${req.ip}-${req.headers['user-agent']}-${Date.now()}`)
                     .digest('hex')
                     .substring(0, 32);
  
  return sessionId;
};

// Sanitize HTML input (basic XSS protection)
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format relative time
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
};

// Generate random string for various purposes
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

// Rate limiting helper
export const createRateLimitKey = (prefix, identifier) => {
  return `${prefix}:${identifier}`;
};

// Pagination helper
export const getPaginationParams = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    offset,
  };
};

// Error response helper
export const createErrorResponse = (message, status = 500, details = null) => {
  const response = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
};

// Success response helper
export const createSuccessResponse = (data, message = 'Success', status = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};
