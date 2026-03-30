const crypto = require('crypto');
const SecurityLogger = require('../middleware/securityLogger.js');

class SecurityMonitoringService {
  constructor() {
    this.alerts = new Map(); // alert_id -> AlertData
    this.eventQueue = [];
    this.thresholds = {
      failedLogins: 5, // 5 failed logins in 15 minutes
      mfaFailures: 3,  // 3 MFA failures in 15 minutes
      rateLimitViolations: 10, // 10 rate limit violations in 15 minutes
      suspiciousIPs: 20, // 20 requests from same IP in 5 minutes
      adminAccess: 1, // Any admin access triggers monitoring
      piiAccess: 10, // 10 PII access events in 15 minutes
      bruteForceAttempts: 10, // 10 failed attempts from same IP
      dataExfiltration: 50 // 50 large data requests in 15 minutes
    };
    
    this.windows = {
      short: 5 * 60 * 1000,    // 5 minutes
      medium: 15 * 60 * 1000,  // 15 minutes
      long: 60 * 60 * 1000     // 1 hour
    };

    this.severityLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Log security event
   * @param {object} eventData - Security event data
   */
  logSecurityEvent(eventData) {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: eventData.type,
      severity: eventData.severity || 'medium',
      userId: eventData.userId,
      ip: eventData.ip,
      userAgent: eventData.userAgent,
      endpoint: eventData.endpoint,
      method: eventData.method,
      description: eventData.description,
      metadata: eventData.metadata || {}
    };

    this.eventQueue.push(event);
    
    // Process event immediately for critical events
    if (event.severity === 'critical') {
      this.processEvent(event);
    }

    SecurityLogger.info('Security event logged', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      userId: event.userId
    });

    return event;
  }

  /**
   * Process security event and check for alerts
   * @param {object} event - Security event
   */
  processEvent(event) {
    const alerts = [];

    // Check for various alert conditions
    switch (event.type) {
      case 'login_failure':
        alerts.push(...this.checkFailedLoginPattern(event));
        break;
      case 'mfa_failure':
        alerts.push(...this.checkMFAFailurePattern(event));
        break;
      case 'rate_limit_violation':
        alerts.push(...this.checkRateLimitPattern(event));
        break;
      case 'admin_access':
        alerts.push(...this.checkAdminAccessPattern(event));
        break;
      case 'pii_access':
        alerts.push(...this.checkPIIAccessPattern(event));
        break;
      case 'suspicious_activity':
        alerts.push(...this.checkSuspiciousActivityPattern(event));
        break;
      case 'data_access':
        alerts.push(...this.checkDataAccessPattern(event));
        break;
    }

    // Generate alerts
    alerts.forEach(alert => {
      this.generateAlert(alert);
    });
  }

  /**
   * Check for failed login patterns
   */
  checkFailedLoginPattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.ip, 'login_failure', this.windows.medium);
    
    if (recentEvents.length >= this.thresholds.failedLogins) {
      alerts.push({
        type: 'brute_force_attack',
        severity: 'high',
        description: `Brute force attack detected from IP ${event.ip}`,
        ip: event.ip,
        count: recentEvents.length,
        timeWindow: this.windows.medium
      });
    }

    return alerts;
  }

  /**
   * Check for MFA failure patterns
   */
  checkMFAFailurePattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.userId, 'mfa_failure', this.windows.medium);
    
    if (recentEvents.length >= this.thresholds.mfaFailures) {
      alerts.push({
        type: 'mfa_attack',
        severity: 'high',
        description: `MFA attack detected for user ${event.userId}`,
        userId: event.userId,
        count: recentEvents.length,
        timeWindow: this.windows.medium
      });
    }

    return alerts;
  }

  /**
   * Check for rate limit violation patterns
   */
  checkRateLimitPattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.ip, 'rate_limit_violation', this.windows.medium);
    
    if (recentEvents.length >= this.thresholds.rateLimitViolations) {
      alerts.push({
        type: 'abusive_behavior',
        severity: 'medium',
        description: `Abusive behavior detected from IP ${event.ip}`,
        ip: event.ip,
        count: recentEvents.length,
        timeWindow: this.windows.medium
      });
    }

    return alerts;
  }

  /**
   * Check for admin access patterns
   */
  checkAdminAccessPattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.userId, 'admin_access', this.windows.short);
    
    // Any admin access should be monitored
    alerts.push({
      type: 'admin_access',
      severity: 'medium',
      description: `Admin access detected for user ${event.userId}`,
      userId: event.userId,
      endpoint: event.endpoint,
      method: event.method
    });

    // Check for unusual admin access patterns
    if (recentEvents.length > 5) {
      alerts.push({
        type: 'excessive_admin_access',
        severity: 'high',
        description: `Excessive admin access detected for user ${event.userId}`,
        userId: event.userId,
        count: recentEvents.length,
        timeWindow: this.windows.short
      });
    }

    return alerts;
  }

  /**
   * Check for PII access patterns
   */
  checkPIIAccessPattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.userId, 'pii_access', this.windows.medium);
    
    if (recentEvents.length >= this.thresholds.piiAccess) {
      alerts.push({
        type: 'excessive_pii_access',
        severity: 'medium',
        description: `Excessive PII access detected for user ${event.userId}`,
        userId: event.userId,
        count: recentEvents.length,
        timeWindow: this.windows.medium
      });
    }

    return alerts;
  }

  /**
   * Check for suspicious activity patterns
   */
  checkSuspiciousActivityPattern(event) {
    const alerts = [];
    
    // Check for multiple IPs from same user
    const userIPs = this.getRecentEvents(event.userId, 'suspicious_activity', this.windows.short)
      .map(e => e.ip)
      .filter((ip, index, arr) => arr.indexOf(ip) === index);
    
    if (userIPs.length > 3) {
      alerts.push({
        type: 'multiple_ip_access',
        severity: 'medium',
        description: `User ${event.userId} accessing from multiple IPs`,
        userId: event.userId,
        ips: userIPs,
        count: userIPs.length
      });
    }

    return alerts;
  }

  /**
   * Check for data access patterns
   */
  checkDataAccessPattern(event) {
    const alerts = [];
    const recentEvents = this.getRecentEvents(event.userId, 'data_access', this.windows.medium);
    
    // Check for large data requests
    if (event.metadata?.size && event.metadata.size > 1024 * 1024) { // 1MB
      alerts.push({
        type: 'large_data_access',
        severity: 'medium',
        description: `Large data access detected for user ${event.userId}`,
        userId: event.userId,
        size: event.metadata.size,
        endpoint: event.endpoint
      });
    }

    // Check for excessive data requests
    if (recentEvents.length >= this.thresholds.dataExfiltration) {
      alerts.push({
        type: 'potential_data_exfiltration',
        severity: 'high',
        description: `Potential data exfiltration detected for user ${event.userId}`,
        userId: event.userId,
        count: recentEvents.length,
        timeWindow: this.windows.medium
      });
    }

    return alerts;
  }

  /**
   * Generate security alert
   * @param {object} alertData - Alert data
   */
  generateAlert(alertData) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      type: alertData.type,
      severity: alertData.severity,
      description: alertData.description,
      userId: alertData.userId,
      ip: alertData.ip,
      metadata: alertData.metadata || {},
      status: 'active',
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedBy: null,
      resolvedAt: null
    };

    this.alerts.set(alert.id, alert);

    // Log alert
    SecurityLogger.warn('Security alert generated', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.description
    });

    // Send notifications for critical alerts
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert);
    }

    return alert;
  }

  /**
   * Send critical alert notification
   * @param {object} alert - Alert data
   */
  sendCriticalAlert(alert) {
    // In production, this would send email, SMS, Slack, etc.
    console.log('🚨 CRITICAL SECURITY ALERT:', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      timestamp: alert.timestamp
    });

    // Store for immediate attention
    SecurityLogger.error('CRITICAL SECURITY ALERT', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      requiresImmediateAttention: true
    });
  }

  /**
   * Get recent events by criteria
   * @param {string} identifier - User ID or IP
   * @param {string} eventType - Event type
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {array} Recent events
   */
  getRecentEvents(identifier, eventType, timeWindow) {
    const now = Date.now();
    const cutoffTime = now - timeWindow;

    return this.eventQueue.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= cutoffTime &&
             event.type === eventType &&
             (event.userId === identifier || event.ip === identifier);
    });
  }

  /**
   * Get active alerts
   * @param {object} filters - Alert filters
   * @returns {array} Active alerts
   */
  getActiveAlerts(filters = {}) {
    const alerts = Array.from(this.alerts.values());
    
    return alerts.filter(alert => {
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.type && alert.type !== filters.type) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged) return false;
      
      return true;
    });
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} acknowledgedBy - User acknowledging the alert
   * @returns {object} Updated alert
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    SecurityLogger.info('Alert acknowledged', {
      alertId: alertId,
      acknowledgedBy: acknowledgedBy
    });

    return alert;
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {string} resolvedBy - User resolving the alert
   * @param {string} resolution - Resolution notes
   * @returns {object} Updated alert
   */
  resolveAlert(alertId, resolvedBy, resolution) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.resolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date().toISOString();
    alert.resolution = resolution;
    alert.status = 'resolved';

    SecurityLogger.info('Alert resolved', {
      alertId: alertId,
      resolvedBy: resolvedBy,
      resolution: resolution
    });

    return alert;
  }

  /**
   * Get security statistics
   * @returns {object} Security statistics
   */
  getSecurityStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recentEvents = this.eventQueue.filter(event => 
      new Date(event.timestamp).getTime() >= last24Hours
    );

    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

    const eventTypes = {};
    recentEvents.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.eventQueue.length,
      recentEvents24h: recentEvents.length,
      recentEvents1h: recentEvents.filter(event => 
        new Date(event.timestamp).getTime() >= lastHour
      ).length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      eventTypes: eventTypes,
      alertsBySeverity: {
        low: activeAlerts.filter(alert => alert.severity === 'low').length,
        medium: activeAlerts.filter(alert => alert.severity === 'medium').length,
        high: activeAlerts.filter(alert => alert.severity === 'high').length,
        critical: criticalAlerts.length
      }
    };
  }

  /**
   * Generate event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate alert ID
   * @returns {string} Alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Start monitoring process
   */
  startMonitoring() {
    // Process events every 30 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 30 * 1000);

    // Cleanup old events every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    SecurityLogger.info('Security monitoring service started');
  }

  /**
   * Process event queue
   */
  processEventQueue() {
    const eventsToProcess = this.eventQueue.splice(0); // Get all events
    
    eventsToProcess.forEach(event => {
      if (event.severity !== 'critical') {
        this.processEvent(event);
      }
    });

    if (eventsToProcess.length > 0) {
      SecurityLogger.info('Security events processed', {
        count: eventsToProcess.length
      });
    }
  }

  /**
   * Cleanup old events and resolved alerts
   */
  cleanup() {
    const now = Date.now();
    const cutoffTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Clean old events
    const initialEventCount = this.eventQueue.length;
    this.eventQueue = this.eventQueue.filter(event => 
      new Date(event.timestamp).getTime() >= cutoffTime
    );

    // Clean resolved alerts older than 30 days
    const alertCutoffTime = now - (30 * 24 * 60 * 60 * 1000);
    let cleanedAlerts = 0;
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && new Date(alert.resolvedAt).getTime() < alertCutoffTime) {
        this.alerts.delete(alertId);
        cleanedAlerts++;
      }
    }

    SecurityLogger.info('Security monitoring cleanup completed', {
      eventsRemoved: initialEventCount - this.eventQueue.length,
      alertsRemoved: cleanedAlerts,
      remainingEvents: this.eventQueue.length,
      remainingAlerts: this.alerts.size
    });
  }
}

// Singleton instance
const securityMonitoringService = new SecurityMonitoringService();

module.exports = securityMonitoringService;
