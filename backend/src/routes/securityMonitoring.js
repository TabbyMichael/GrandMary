const express = require('express');
const securityMonitoringService = require('../services/securityMonitoringService.js');
const { BaseError } = require('../errors/index.js');
const SecurityLogger = require('../middleware/securityLogger.js');

const router = express.Router();

/**
 * Get security statistics
 * GET /api/security/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const statistics = securityMonitoringService.getSecurityStatistics();

    SecurityLogger.info('Security statistics accessed', {
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    SecurityLogger.error('Security statistics access failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_STATISTICS_ACCESS_FAILED'
    });
  }
});

/**
 * Get active security alerts
 * GET /api/security/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const filters = {
      severity: req.query.severity,
      type: req.query.type,
      status: req.query.status,
      acknowledged: req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined
    };

    const alerts = securityMonitoringService.getActiveAlerts(filters);

    SecurityLogger.info('Security alerts accessed', {
      userId: req.user.id,
      ip: req.ip,
      filters: filters
    });

    res.json({
      success: true,
      data: alerts
    });
    
  } catch (error) {
    SecurityLogger.error('Security alerts access failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_ALERTS_ACCESS_FAILED'
    });
  }
});

/**
 * Acknowledge security alert
 * POST /api/security/alerts/:alertId/acknowledge
 */
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const { alertId } = req.params;
    const acknowledgedBy = req.user.id;

    const alert = securityMonitoringService.acknowledgeAlert(alertId, acknowledgedBy);

    SecurityLogger.info('Security alert acknowledged', {
      alertId: alertId,
      acknowledgedBy: acknowledgedBy,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: alert
    });
    
  } catch (error) {
    SecurityLogger.error('Security alert acknowledgment failed', {
      error: error.message,
      alertId: req.params.alertId,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_ALERT_ACKNOWLEDGMENT_FAILED'
    });
  }
});

/**
 * Resolve security alert
 * POST /api/security/alerts/:alertId/resolve
 */
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const { alertId } = req.params;
    const { resolution } = req.body;
    const resolvedBy = req.user.id;

    if (!resolution) {
      throw new BaseError('RESOLUTION_REQUIRED', 'Resolution notes are required', 400);
    }

    const alert = securityMonitoringService.resolveAlert(alertId, resolvedBy, resolution);

    SecurityLogger.info('Security alert resolved', {
      alertId: alertId,
      resolvedBy: resolvedBy,
      resolution: resolution,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });
    
  } catch (error) {
    SecurityLogger.error('Security alert resolution failed', {
      error: error.message,
      alertId: req.params.alertId,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_ALERT_RESOLUTION_FAILED'
    });
  }
});

/**
 * Log custom security event
 * POST /api/security/events
 */
router.post('/events', async (req, res) => {
  try {
    const { type, severity, description, metadata } = req.body;
    
    if (!type || !description) {
      throw new BaseError('INVALID_REQUEST', 'Event type and description are required', 400);
    }

    const eventData = {
      type: type,
      severity: severity || 'medium',
      description: description,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      metadata: metadata || {}
    };

    const event = securityMonitoringService.logSecurityEvent(eventData);

    SecurityLogger.info('Custom security event logged', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Security event logged successfully',
      data: event
    });
    
  } catch (error) {
    SecurityLogger.error('Security event logging failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_EVENT_LOGGING_FAILED'
    });
  }
});

/**
 * Get security dashboard data
 * GET /api/security/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const statistics = securityMonitoringService.getSecurityStatistics();
    const alerts = securityMonitoringService.getActiveAlerts({ acknowledged: false });
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const highAlerts = alerts.filter(alert => alert.severity === 'high');

    const dashboardData = {
      overview: {
        totalEvents: statistics.totalEvents,
        recentEvents24h: statistics.recentEvents24h,
        activeAlerts: statistics.activeAlerts,
        criticalAlerts: statistics.criticalAlerts
      },
      alerts: {
        total: alerts.length,
        critical: criticalAlerts.length,
        high: highAlerts.length,
        recent: alerts.slice(0, 10) // Last 10 alerts
      },
      trends: {
        eventTypes: statistics.eventTypes,
        alertsBySeverity: statistics.alertsBySeverity
      },
      health: {
        status: criticalAlerts.length > 0 ? 'critical' : 
                highAlerts.length > 5 ? 'warning' : 'healthy',
        lastUpdated: new Date().toISOString()
      }
    };

    SecurityLogger.info('Security dashboard accessed', {
      userId: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    SecurityLogger.error('Security dashboard access failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_DASHBOARD_ACCESS_FAILED'
    });
  }
});

/**
 * Get security recommendations
 * GET /api/security/recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const statistics = securityMonitoringService.getSecurityStatistics();
    const alerts = securityMonitoringService.getActiveAlerts();
    
    const recommendations = [];

    // Analyze patterns and generate recommendations
    if (statistics.criticalAlerts > 0) {
      recommendations.push({
        type: 'critical',
        priority: 'high',
        title: 'Address Critical Security Alerts',
        description: `You have ${statistics.criticalAlerts} critical security alerts requiring immediate attention.`,
        action: 'Review and resolve all critical alerts in the security dashboard.'
      });
    }

    if (statistics.activeAlerts > 20) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'High Number of Active Alerts',
        description: `You have ${statistics.activeAlerts} active security alerts. Consider reviewing your security policies.`,
        action: 'Review alert thresholds and security configurations to reduce false positives.'
      });
    }

    if (statistics.eventTypes['login_failure'] > 50) {
      recommendations.push({
        type: 'authentication',
        priority: 'high',
        title: 'High Number of Failed Logins',
        description: `Detected ${statistics.eventTypes['login_failure']} failed login attempts in the last 24 hours.`,
        action: 'Consider implementing stronger authentication policies or IP whitelisting.'
      });
    }

    if (statistics.eventTypes['rate_limit_violation'] > 100) {
      recommendations.push({
        type: 'rate_limiting',
        priority: 'medium',
        title: 'High Rate Limit Violations',
        description: `Detected ${statistics.eventTypes['rate_limit_violation']} rate limit violations in the last 24 hours.`,
        action: 'Review rate limiting thresholds and consider stricter limits for abusive IPs.'
      });
    }

    // Default recommendations if no specific issues
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        title: 'Security Health Good',
        description: 'Your security monitoring is working well with no critical issues.',
        action: 'Continue regular security monitoring and periodic reviews.'
      });
    }

    SecurityLogger.info('Security recommendations accessed', {
      userId: req.user.id,
      ip: req.ip,
      recommendationsCount: recommendations.length
    });

    res.json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    SecurityLogger.error('Security recommendations access failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_RECOMMENDATIONS_ACCESS_FAILED'
    });
  }
});

/**
 * Export security data
 * GET /api/security/export
 */
router.get('/export', async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new BaseError('ADMIN_ACCESS_REQUIRED', 'Admin access required', 403);
    }

    const { format = 'json', days = 7 } = req.query;
    const daysNum = parseInt(days) || 7;
    
    const statistics = securityMonitoringService.getSecurityStatistics();
    const alerts = securityMonitoringService.getActiveAlerts();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      period: `Last ${daysNum} days`,
      statistics: statistics,
      alerts: alerts,
      summary: {
        totalEvents: statistics.totalEvents,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        healthStatus: alerts.filter(a => a.severity === 'critical').length > 0 ? 'critical' : 'healthy'
      }
    };

    SecurityLogger.info('Security data exported', {
      userId: req.user.id,
      ip: req.ip,
      format: format,
      days: daysNum
    });

    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-export-${new Date().toISOString().split('T')[0]}.csv"`);
      
      const csvData = this.convertToCSV(exportData);
      res.send(csvData);
    } else {
      // JSON format (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="security-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
    
  } catch (error) {
    SecurityLogger.error('Security data export failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'SECURITY_DATA_EXPORT_FAILED'
    });
  }
});

/**
 * Convert security data to CSV format
 */
function convertToCSV(data) {
  const headers = ['Timestamp', 'Type', 'Severity', 'Description', 'User ID', 'IP Address', 'Status'];
  const rows = [headers.join(',')];

  // Add alerts data
  data.alerts.forEach(alert => {
    const row = [
      `"${alert.timestamp}"`,
      `"${alert.type}"`,
      `"${alert.severity}"`,
      `"${alert.description}"`,
      `"${alert.userId || ''}"`,
      `"${alert.ip || ''}"`,
      `"${alert.status}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

module.exports = router;
