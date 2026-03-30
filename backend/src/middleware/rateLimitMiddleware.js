const rateLimitService = require('../services/rateLimitService.js');

/**
 * Rate Limiting Middleware
 * Provides user-specific, IP-specific, and global rate limiting
 */
class RateLimitMiddleware {
  /**
   * Rate limiting middleware for API endpoints
   * @param {object} options - Rate limiting options
   * @returns {function} Express middleware
   */
  static rateLimit(options = {}) {
    return (req, res, next) => {
      try {
        // Get user information
        const userId = req.user?.id || req.ip; // Fallback to IP if no user
        const userRole = req.user?.role || 'user';
        const endpoint = req.path;
        const ip = req.ip;

        // Check rate limits
        const limitStatus = rateLimitService.checkRateLimit(userId, endpoint, ip, userRole);

        // Add rate limit headers
        const headers = rateLimitService.generateRateLimitHeaders(limitStatus);
        Object.entries(headers).forEach(([key, value]) => {
          res.set(key, value);
        });

        // Check if request is allowed
        if (!limitStatus.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: limitStatus.retryAfter,
            limits: {
              user: limitStatus.limits.user,
              ip: limitStatus.limits.ip,
              global: limitStatus.limits.global
            }
          });
        }

        // Add rate limit info to request for logging
        req.rateLimit = limitStatus;

        next();
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Strict rate limiting for sensitive endpoints
   * @returns {function} Express middleware
   */
  static strictRateLimit() {
    return this.rateLimit({
      userMultiplier: 0.3, // 30% of normal limits
      ipMultiplier: 0.5,   // 50% of normal limits
      globalMultiplier: 0.8 // 80% of normal limits
    });
  }

  /**
   * Rate limiting for authentication endpoints
   * @returns {function} Express middleware
   */
  static authRateLimit() {
    return this.rateLimit({
      userMultiplier: 0.2, // Very strict for auth
      ipMultiplier: 0.3,
      globalMultiplier: 0.5
    });
  }

  /**
   * Rate limiting for admin endpoints
   * @returns {function} Express middleware
   */
  static adminRateLimit() {
    return (req, res, next) => {
      // Only apply to admin users
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }

      // Apply strict rate limiting for admin operations
      return this.strictRateLimit()(req, res, next);
    };
  }

  /**
   * Rate limiting for file uploads
   * @returns {function} Express middleware
   */
  static uploadRateLimit() {
    return this.rateLimit({
      userMultiplier: 0.1, // Very strict for uploads
      ipMultiplier: 0.2,
      globalMultiplier: 0.3
    });
  }

  /**
   * Rate limiting for public endpoints
   * @returns {function} Express middleware
   */
  static publicRateLimit() {
    return this.rateLimit({
      userMultiplier: 1.0, // Normal limits for public
      ipMultiplier: 0.8,   // Slightly stricter for IP
      globalMultiplier: 1.0
    });
  }

  /**
   * Rate limiting middleware with custom configuration
   * @param {object} config - Custom rate limit configuration
   * @returns {function} Express middleware
   */
  static customRateLimit(config) {
    return (req, res, next) => {
      try {
        const userId = req.user?.id || req.ip;
        const userRole = req.user?.role || 'user';
        const endpoint = req.path;
        const ip = req.ip;

        // Apply custom multipliers
        const userMultiplier = config.userMultiplier || 1.0;
        const ipMultiplier = config.ipMultiplier || 1.0;
        const globalMultiplier = config.globalMultiplier || 1.0;

        // Check rate limits with custom multipliers
        const limitStatus = rateLimitService.checkRateLimit(userId, endpoint, ip, userRole);

        // Apply multipliers to limits
        if (limitStatus.limits.user) {
          limitStatus.limits.user.max = Math.floor(limitStatus.limits.user.max * userMultiplier);
          limitStatus.limits.user.allowed = limitStatus.limits.user.current <= limitStatus.limits.user.max;
        }

        if (limitStatus.limits.ip) {
          limitStatus.limits.ip.max = Math.floor(limitStatus.limits.ip.max * ipMultiplier);
          limitStatus.limits.ip.allowed = limitStatus.limits.ip.current <= limitStatus.limits.ip.max;
        }

        if (limitStatus.limits.global) {
          limitStatus.limits.global.max = Math.floor(limitStatus.limits.global.max * globalMultiplier);
          limitStatus.limits.global.allowed = limitStatus.limits.global.current <= limitStatus.limits.global.max;
        }

        // Add rate limit headers
        const headers = rateLimitService.generateRateLimitHeaders(limitStatus);
        Object.entries(headers).forEach(([key, value]) => {
          res.set(key, value);
        });

        // Check if request is allowed
        if (!limitStatus.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: limitStatus.retryAfter,
            limits: {
              user: limitStatus.limits.user,
              ip: limitStatus.limits.ip,
              global: limitStatus.limits.global
            }
          });
        }

        req.rateLimit = limitStatus;
        next();
      } catch (error) {
        console.error('Custom rate limiting middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Rate limiting status endpoint middleware
   * @returns {function} Express middleware
   */
  static rateLimitStatus() {
    return (req, res) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED'
          });
        }

        const status = rateLimitService.getUserRateLimitStatus(userId);
        const statistics = rateLimitService.getStatistics();

        res.json({
          success: true,
          data: {
            user: status,
            statistics: statistics,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Rate limit status error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get rate limit status',
          code: 'RATE_LIMIT_STATUS_FAILED'
        });
      }
    };
  }

  /**
   * Rate limiting reset endpoint middleware (admin only)
   * @returns {function} Express middleware
   */
  static resetRateLimit() {
    return (req, res) => {
      try {
        // Admin check
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'ADMIN_ACCESS_REQUIRED'
          });
        }

        const { userId, ip } = req.body;

        if (userId) {
          rateLimitService.resetUserRateLimit(userId);
        }

        if (ip) {
          rateLimitService.resetIPRateLimit(ip);
        }

        res.json({
          success: true,
          message: 'Rate limit reset successfully'
        });
      } catch (error) {
        console.error('Rate limit reset error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to reset rate limit',
          code: 'RATE_LIMIT_RESET_FAILED'
        });
      }
    };
  }

  /**
   * Rate limiting configuration update endpoint (admin only)
   * @returns {function} Express middleware
   */
  static updateRateLimitConfig() {
    return (req, res) => {
      try {
        // Admin check
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'ADMIN_ACCESS_REQUIRED'
          });
        }

        const { userType, config } = req.body;

        if (!userType || !config) {
          return res.status(400).json({
            success: false,
            error: 'User type and config are required',
            code: 'INVALID_REQUEST'
          });
        }

        rateLimitService.updateRateLimitConfig(userType, config);

        res.json({
          success: true,
          message: 'Rate limit configuration updated successfully'
        });
      } catch (error) {
        console.error('Rate limit config update error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update rate limit configuration',
          code: 'RATE_LIMIT_CONFIG_UPDATE_FAILED'
        });
      }
    };
  }
}

module.exports = RateLimitMiddleware;
