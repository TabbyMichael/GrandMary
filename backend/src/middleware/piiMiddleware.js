const encryptionService = require('../services/encryptionService.js');

/**
 * PII Middleware - Automatically encrypt/decrypt sensitive data
 */
class PIIMiddleware {
  /**
   * Middleware to encrypt PII in request body
   */
  static encryptRequestBody(req, res, next) {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = this.encryptData(req.body);
      }
      next();
    } catch (error) {
      console.error('PII encryption middleware error:', error);
      next(error);
    }
  }

  /**
   * Middleware to decrypt PII for authorized users
   */
  static decryptResponse(req, res, next) {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to decrypt data before sending
    res.json = function(data) {
      try {
        // Only decrypt if user has proper permissions
        if (req.user && req.user.role === 'admin') {
          data = PIIMiddleware.decryptData(data);
        } else {
          // Remove PII fields for non-admin users
          data = PIIMiddleware.sanitizeData(data);
        }
      } catch (error) {
        console.error('PII decryption middleware error:', error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Recursively encrypt PII fields in data object
   */
  static encryptData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const piiFields = [
      'email', 'phone', 'fullName', 'firstName', 'lastName',
      'address', 'relationship', 'author_name', 'commenter_name',
      'reactor_name', 'reporter_name', 'uploader_name'
    ];

    const encrypted = { ...data };

    Object.keys(encrypted).forEach(key => {
      const value = encrypted[key];

      if (piiFields.includes(key) && typeof value === 'string') {
        // Encrypt the PII field
        if (key.includes('email')) {
          encrypted[key] = encryptionService.encryptEmail(value);
        } else if (key.includes('phone')) {
          encrypted[key] = encryptionService.encryptPhone(value);
        } else {
          encrypted[key] = encryptionService.encrypt(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively encrypt nested objects
        encrypted[key] = this.encryptData(value);
      } else if (Array.isArray(value)) {
        // Encrypt PII in arrays
        encrypted[key] = value.map(item => this.encryptData(item));
      }
    });

    return encrypted;
  }

  /**
   * Recursively decrypt PII fields in data object
   */
  static decryptData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const piiFields = [
      'email', 'phone', 'fullName', 'firstName', 'lastName',
      'address', 'relationship', 'author_name', 'commenter_name',
      'reactor_name', 'reporter_name', 'uploader_name'
    ];

    const decrypted = { ...data };

    Object.keys(decrypted).forEach(key => {
      const value = decrypted[key];

      if (piiFields.includes(key) && typeof value === 'object' && value.encrypted) {
        // Decrypt the PII field
        try {
          if (key.includes('email')) {
            decrypted[key] = encryptionService.decryptEmail(value);
          } else if (key.includes('phone')) {
            decrypted[key] = encryptionService.decryptPhone(value);
          } else {
            decrypted[key] = encryptionService.decrypt(value);
          }
        } catch (error) {
          console.error(`Failed to decrypt ${key}:`, error.message);
          decrypted[key] = '[DECRYPTION_FAILED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively decrypt nested objects
        decrypted[key] = this.decryptData(value);
      } else if (Array.isArray(value)) {
        // Decrypt PII in arrays
        decrypted[key] = value.map(item => this.decryptData(item));
      }
    });

    return decrypted;
  }

  /**
   * Remove PII fields from data for non-authorized users
   */
  static sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const piiFields = [
      'email', 'phone', 'fullName', 'firstName', 'lastName',
      'address', 'relationship', 'author_name', 'commenter_name',
      'reactor_name', 'reporter_name', 'uploader_name'
    ];

    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];

      if (piiFields.includes(key)) {
        // Remove or mask PII fields
        if (key.includes('email')) {
          sanitized[key] = value && value.encrypted ? '[ENCRYPTED_EMAIL]' : '[EMAIL_REDACTED]';
        } else if (key.includes('phone')) {
          sanitized[key] = value && value.encrypted ? '[ENCRYPTED_PHONE]' : '[PHONE_REDACTED]';
        } else {
          sanitized[key] = value && value.encrypted ? '[ENCRYPTED_DATA]' : '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value);
      } else if (Array.isArray(value)) {
        // Sanitize PII in arrays
        sanitized[key] = value.map(item => this.sanitizeData(item));
      }
    });

    return sanitized;
  }

  /**
   * Middleware to log PII access attempts
   */
  static logPIIAccess(req, res, next) {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log if PII is being accessed
      const hasPII = JSON.stringify(data).match(/email|phone|fullName|address/gi);
      
      if (hasPII && req.user) {
        console.log(`🔍 PII Access Log:`, {
          user_id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          endpoint: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          ip: req.ip
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Validate PII data format
   */
  static validatePII(data) {
    const errors = [];

    // Validate email
    if (data.email && !encryptionService.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone
    if (data.phone && !encryptionService.isValidPhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    // Validate required fields
    const requiredFields = ['username'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PIIMiddleware;
