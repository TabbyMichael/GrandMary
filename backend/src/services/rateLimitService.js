const crypto = require('crypto');
const SecurityLogger = require('../middleware/securityLogger.js');

class RateLimitService {
  constructor() {
    this.limits = new Map(); // user_id -> RateLimitData
    this.globalLimits = new Map(); // global -> RateLimitData
    this.ipLimits = new Map(); // ip_address -> RateLimitData
    
    // Default rate limits
    this.defaultLimits = {
      user: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        sensitiveMultiplier: 0.5 // Reduce limits for sensitive operations
      },
      admin: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 200,
        sensitiveMultiplier: 0.3 // Stricter limits for admin operations
      },
      global: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000
      },
      ip: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50
      }
    };

    // Sensitive endpoints with stricter limits
    this.sensitiveEndpoints = [
      '/api/auth/login',
      '/api/auth/mfa',
      '/api/admin',
      '/api/users/delete',
      '/api/gallery/approve',
      '/api/tributes/delete',
      '/api/comments/delete'
    ];

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check rate limit for user
   * @param {string} userId - User ID
   * @param {string} endpoint - API endpoint
   * @param {string} ip - IP address
   * @param {string} userRole - User role
   * @returns {object} Rate limit status
   */
  checkRateLimit(userId, endpoint, ip, userRole = 'user') {
    const now = Date.now();
    const isSensitive = this.sensitiveEndpoints.some(sensitive => endpoint.startsWith(sensitive));
    
    // Check user rate limit
    const userLimit = this.checkUserRateLimit(userId, userRole, isSensitive, now);
    
    // Check IP rate limit
    const ipLimit = this.checkIPRateLimit(ip, now);
    
    // Check global rate limit
    const globalLimit = this.checkGlobalRateLimit(now);

    // Log rate limit violations
    if (!userLimit.allowed || !ipLimit.allowed || !globalLimit.allowed) {
      this.logRateLimitViolation(userId, endpoint, ip, userRole, {
        user: userLimit,
        ip: ipLimit,
        global: globalLimit
      });
    }

    return {
      allowed: userLimit.allowed && ipLimit.allowed && globalLimit.allowed,
      limits: {
        user: userLimit,
        ip: ipLimit,
        global: globalLimit
      },
      retryAfter: Math.max(
        userLimit.retryAfter || 0,
        ipLimit.retryAfter || 0,
        globalLimit.retryAfter || 0
      )
    };
  }

  /**
   * Check user-specific rate limit
   */
  checkUserRateLimit(userId, userRole, isSensitive, now) {
    const limitConfig = this.defaultLimits[userRole] || this.defaultLimits.user;
    const maxRequests = isSensitive 
      ? Math.floor(limitConfig.maxRequests * limitConfig.sensitiveMultiplier)
      : limitConfig.maxRequests;

    let userData = this.limits.get(userId);
    
    if (!userData || now - userData.windowStart > limitConfig.windowMs) {
      userData = {
        requests: 0,
        windowStart: now,
        windowMs: limitConfig.windowMs,
        maxRequests: maxRequests
      };
      this.limits.set(userId, userData);
    }

    userData.requests++;

    return {
      allowed: userData.requests <= maxRequests,
      current: userData.requests,
      max: maxRequests,
      windowMs: limitConfig.windowMs,
      retryAfter: userData.requests > maxRequests 
        ? Math.ceil((userData.windowStart + limitConfig.windowMs - now) / 1000)
        : null
    };
  }

  /**
   * Check IP-specific rate limit
   */
  checkIPRateLimit(ip, now) {
    const limitConfig = this.defaultLimits.ip;
    
    let ipData = this.ipLimits.get(ip);
    
    if (!ipData || now - ipData.windowStart > limitConfig.windowMs) {
      ipData = {
        requests: 0,
        windowStart: now,
        windowMs: limitConfig.windowMs,
        maxRequests: limitConfig.maxRequests
      };
      this.ipLimits.set(ip, ipData);
    }

    ipData.requests++;

    return {
      allowed: ipData.requests <= limitConfig.maxRequests,
      current: ipData.requests,
      max: limitConfig.maxRequests,
      windowMs: limitConfig.windowMs,
      retryAfter: ipData.requests > limitConfig.maxRequests 
        ? Math.ceil((ipData.windowStart + limitConfig.windowMs - now) / 1000)
        : null
    };
  }

  /**
   * Check global rate limit
   */
  checkGlobalRateLimit(now) {
    const limitConfig = this.defaultLimits.global;
    
    let globalData = this.globalLimits.get('global');
    
    if (!globalData || now - globalData.windowStart > limitConfig.windowMs) {
      globalData = {
        requests: 0,
        windowStart: now,
        windowMs: limitConfig.windowMs,
        maxRequests: limitConfig.maxRequests
      };
      this.globalLimits.set('global', globalData);
    }

    globalData.requests++;

    return {
      allowed: globalData.requests <= limitConfig.maxRequests,
      current: globalData.requests,
      max: limitConfig.maxRequests,
      windowMs: limitConfig.windowMs,
      retryAfter: globalData.requests > limitConfig.maxRequests 
        ? Math.ceil((globalData.windowStart + limitConfig.windowMs - now) / 1000)
        : null
    };
  }

  /**
   * Get rate limit status for user
   * @param {string} userId - User ID
   * @returns {object} Current rate limit status
   */
  getUserRateLimitStatus(userId) {
    const userData = this.limits.get(userId);
    
    if (!userData) {
      return {
        allowed: true,
        current: 0,
        max: this.defaultLimits.user.maxRequests,
        windowMs: this.defaultLimits.user.windowMs,
        retryAfter: null
      };
    }

    const now = Date.now();
    const isExpired = now - userData.windowStart > userData.windowMs;
    
    return {
      allowed: !isExpired && userData.requests <= userData.maxRequests,
      current: isExpired ? 0 : userData.requests,
      max: userData.maxRequests,
      windowMs: userData.windowMs,
      retryAfter: isExpired ? null : 
        userData.requests > userData.maxRequests 
          ? Math.ceil((userData.windowStart + userData.windowMs - now) / 1000)
          : null
    };
  }

  /**
   * Reset rate limit for user
   * @param {string} userId - User ID
   */
  resetUserRateLimit(userId) {
    this.limits.delete(userId);
    
    SecurityLogger.info('Rate limit reset for user', {
      userId: userId,
      action: 'rate_limit_reset'
    });
  }

  /**
   * Reset rate limit for IP
   * @param {string} ip - IP address
   */
  resetIPRateLimit(ip) {
    this.ipLimits.delete(ip);
    
    SecurityLogger.info('Rate limit reset for IP', {
      ip: ip,
      action: 'rate_limit_reset'
    });
  }

  /**
   * Update rate limit configuration
   * @param {string} userType - User type (user, admin, global, ip)
   * @param {object} newConfig - New configuration
   */
  updateRateLimitConfig(userType, newConfig) {
    if (this.defaultLimits[userType]) {
      this.defaultLimits[userType] = { ...this.defaultLimits[userType], ...newConfig };
      
      SecurityLogger.info('Rate limit configuration updated', {
        userType: userType,
        newConfig: newConfig
      });
    }
  }

  /**
   * Get rate limit statistics
   * @returns {object} Rate limit statistics
   */
  getStatistics() {
    const now = Date.now();
    const activeUsers = this.limits.size;
    const activeIPs = this.ipLimits.size;
    
    let totalUserRequests = 0;
    let totalIPRequests = 0;
    let totalGlobalRequests = 0;
    
    // Count user requests
    this.limits.forEach(userData => {
      if (now - userData.windowStart <= userData.windowMs) {
        totalUserRequests += userData.requests;
      }
    });
    
    // Count IP requests
    this.ipLimits.forEach(ipData => {
      if (now - ipData.windowStart <= ipData.windowMs) {
        totalIPRequests += ipData.requests;
      }
    });
    
    // Count global requests
    const globalData = this.globalLimits.get('global');
    if (globalData && now - globalData.windowStart <= globalData.windowMs) {
      totalGlobalRequests = globalData.requests;
    }

    return {
      activeUsers,
      activeIPs,
      totalUserRequests,
      totalIPRequests,
      totalGlobalRequests,
      memoryUsage: {
        users: this.limits.size,
        ips: this.ipLimits.size,
        global: this.globalLimits.size
      }
    };
  }

  /**
   * Log rate limit violations
   */
  logRateLimitViolation(userId, endpoint, ip, userRole, limits) {
    const violationReasons = [];
    
    if (!limits.user.allowed) violationReasons.push('user_limit_exceeded');
    if (!limits.ip.allowed) violationReasons.push('ip_limit_exceeded');
    if (!limits.global.allowed) violationReasons.push('global_limit_exceeded');

    SecurityLogger.warn('Rate limit violation detected', {
      userId: userId,
      endpoint: endpoint,
      ip: ip,
      userRole: userRole,
      reasons: violationReasons,
      limits: {
        user: { current: limits.user.current, max: limits.user.max },
        ip: { current: limits.ip.current, max: limits.ip.max },
        global: { current: limits.global.current, max: limits.global.max }
      },
      retryAfter: Math.max(
        limits.user.retryAfter || 0,
        limits.ip.retryAfter || 0,
        limits.global.retryAfter || 0
      )
    });
  }

  /**
   * Start cleanup interval to remove expired rate limit data
   */
  startCleanup() {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup expired rate limit data
   */
  cleanup() {
    const now = Date.now();
    let cleanedUsers = 0;
    let cleanedIPs = 0;

    // Cleanup user limits
    for (const [userId, userData] of this.limits.entries()) {
      if (now - userData.windowStart > userData.windowMs) {
        this.limits.delete(userId);
        cleanedUsers++;
      }
    }

    // Cleanup IP limits
    for (const [ip, ipData] of this.ipLimits.entries()) {
      if (now - ipData.windowStart > ipData.windowMs) {
        this.ipLimits.delete(ip);
        cleanedIPs++;
      }
    }

    // Cleanup global limits
    const globalData = this.globalLimits.get('global');
    if (globalData && now - globalData.windowStart > globalData.windowMs) {
      this.globalLimits.delete('global');
    }

    if (cleanedUsers > 0 || cleanedIPs > 0) {
      SecurityLogger.info('Rate limit cleanup completed', {
        cleanedUsers: cleanedUsers,
        cleanedIPs: cleanedIPs,
        remainingUsers: this.limits.size,
        remainingIPs: this.ipLimits.size
      });
    }
  }

  /**
   * Generate rate limit headers for HTTP response
   * @param {object} limitStatus - Rate limit status
   * @returns {object} HTTP headers
   */
  generateRateLimitHeaders(limitStatus) {
    const headers = {};
    
    if (limitStatus.limits.user) {
      headers['X-RateLimit-Limit'] = limitStatus.limits.user.max;
      headers['X-RateLimit-Remaining'] = Math.max(0, limitStatus.limits.user.max - limitStatus.limits.user.current);
      headers['X-RateLimit-Reset'] = new Date(limitStatus.limits.user.windowStart + limitStatus.limits.user.windowMs).toISOString();
    }
    
    if (limitStatus.retryAfter) {
      headers['Retry-After'] = limitStatus.retryAfter;
    }
    
    return headers;
  }
}

// Singleton instance
const rateLimitService = new RateLimitService();

module.exports = rateLimitService;
