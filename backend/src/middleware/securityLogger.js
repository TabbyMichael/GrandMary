import { BaseError } from '../errors/index.js';

class SecurityLogger {
  static sanitizeMeta(meta = {}) {
    const sanitized = { ...meta };
    
    // Sensitive keys to redact
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'authorization',
      'jwt', 'api_key', 'private_key', 'access_token', 'refresh_token',
      'supabase_key', 'service_role_key', 'anon_key', 'db_password',
      'admin_password', 'session_token', 'csrf_token', 'bearer_token'
    ];
    
    // Redact sensitive values
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    // Redact PII patterns
    Object.keys(sanitized).forEach(key => {
      const value = String(sanitized[key]);
      
      // Email patterns
      if (value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        sanitized[key] = value.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, '$1***@$2');
      }
      
      // IP patterns
      if (value.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/)) {
        sanitized[key] = value.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/, '***.***.***.***');
      }
      
      // Phone patterns
      if (value.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)) {
        sanitized[key] = '***-***-****';
      }
      
      // JWT patterns
      if (value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)) {
        sanitized[key] = '[JWT_TOKEN_REDACTED]';
      }
    });
    
    return sanitized;
  }
  
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
}

export default SecurityLogger;
