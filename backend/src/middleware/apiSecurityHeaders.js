/**
 * Security Headers Middleware
 * Implements security headers to prevent data interception and XSS
 */

const helmet = require('helmet');

const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Permissions Policy
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  }
});

// CORS Configuration
const corsConfig = {
  origin: function (origin, callback) {
    // Allow specific origins in production
    const allowedOrigins = [
      'https://everbloom-memorial.netlify.app',
      'https://www.everbloom-memorial.netlify.app',
      'http://localhost:5173', // Development
      'http://localhost:3000'  // Development
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400 // 24 hours
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy for rate limiting behind reverse proxy
  trustProxy: 1
};

// Data validation middleware
const validateRequestData = (req, res, next) => {
  // Remove potential XSS from request data
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = sanitize(obj[key]);
      });
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

// Response data filtering middleware
const filterSensitiveResponseData = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function (data) {
    // Don't filter binary data
    if (Buffer.isBuffer(data)) {
      return originalSend.call(this, data);
    }
    
    try {
      // Try to parse and filter JSON responses
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        const filtered = filterResponseData(parsed);
        return originalSend.call(this, JSON.stringify(filtered));
      } else if (typeof data === 'object') {
        const filtered = filterResponseData(data);
        return originalSend.call(this, filtered);
      }
    } catch (e) {
      // If parsing fails, send original data
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

function filterResponseData(data) {
  if (Array.isArray(data)) {
    return data.map(filterResponseData);
  }
  
  if (data && typeof data === 'object') {
    const filtered = { ...data };
    
    // Remove sensitive fields from responses
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'jwt', 'api_key', 'private_key', 'access_token', 'refresh_token',
      'supabase_key', 'service_role_key', 'admin_password',
      'session_token', 'csrf_token', 'bearer_token', 'ip_address'
    ];
    
    sensitiveFields.forEach(field => {
      if (field in filtered) {
        filtered[field] = '[REDACTED]';
      }
    });
    
    // Recursively filter nested objects
    Object.keys(filtered).forEach(key => {
      if (typeof filtered[key] === 'object') {
        filtered[key] = filterResponseData(filtered[key]);
      }
    });
    
    return filtered;
  }
  
  return data;
}

module.exports = {
  securityHeaders,
  corsConfig,
  rateLimitConfig,
  validateRequestData,
  filterSensitiveResponseData
};
