const express = require('express');
const mfaService = require('../services/mfaService.js');
const encryptionService = require('../services/encryptionService.js');
const { BaseError } = require('../errors/index.js');
const SecurityLogger = require('../middleware/securityLogger.js');

const router = express.Router();

/**
 * Generate MFA secret for user
 * POST /api/auth/mfa/setup
 */
router.post('/setup', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      throw new BaseError('USERNAME_REQUIRED', 'Username is required', 400);
    }

    // Generate MFA secret
    const mfaData = mfaService.generateSecret(username);
    
    // Generate QR code
    const qrCode = await mfaService.generateQRCode(mfaData.totpUri);
    
    // Encrypt secret for storage
    const encryptedSecret = mfaService.encryptSecret(mfaData.secret);
    const encryptedBackupCodes = mfaService.encryptBackupCodes(mfaData.backupCodes);
    
    SecurityLogger.info('MFA setup initiated', {
      username: username,
      ip: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        secret: mfaData.secret, // Only for display during setup
        qrCode: qrCode,
        backupCodes: mfaData.backupCodes,
        encryptedSecret: encryptedSecret,
        encryptedBackupCodes: encryptedBackupCodes
      }
    });
    
  } catch (error) {
    SecurityLogger.error('MFA setup failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_SETUP_FAILED'
    });
  }
});

/**
 * Verify and enable MFA for user
 * POST /api/auth/mfa/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { username, token, encryptedSecret, encryptedBackupCodes } = req.body;
    
    if (!username || !token || !encryptedSecret) {
      throw new BaseError('INVALID_REQUEST', 'Username, token, and secret are required', 400);
    }

    // Decrypt secret
    const secret = mfaService.decryptSecret(encryptedSecret);
    
    // Verify TOTP token
    const isValid = mfaService.verifyTOTP(token, secret);
    
    if (!isValid) {
      mfaService.logMFAAttempt({
        userId: username,
        description: 'MFA verification failed',
        success: false,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      throw new BaseError('INVALID_TOKEN', 'Invalid MFA token', 401);
    }

    // Log successful MFA verification
    mfaService.logMFAAttempt({
      userId: username,
      description: 'MFA verification successful',
      success: true,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });

    SecurityLogger.info('MFA enabled for user', {
      username: username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'MFA verification successful',
      data: {
        mfaEnabled: true,
        encryptedSecret: encryptedSecret,
        encryptedBackupCodes: encryptedBackupCodes
      }
    });
    
  } catch (error) {
    SecurityLogger.error('MFA verification failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_VERIFICATION_FAILED'
    });
  }
});

/**
 * Authenticate with MFA token
 * POST /api/auth/mfa/authenticate
 */
router.post('/authenticate', async (req, res) => {
  try {
    const { username, token, encryptedSecret } = req.body;
    
    if (!username || !token || !encryptedSecret) {
      throw new BaseError('INVALID_REQUEST', 'Username, token, and secret are required', 400);
    }

    // Decrypt secret
    const secret = mfaService.decryptSecret(encryptedSecret);
    
    // Verify TOTP token
    const isValid = mfaService.verifyTOTP(token, secret);
    
    if (!isValid) {
      mfaService.logMFAAttempt({
        userId: username,
        description: 'MFA authentication failed',
        success: false,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      throw new BaseError('INVALID_TOKEN', 'Invalid MFA token', 401);
    }

    // Generate MFA session token
    const sessionToken = mfaService.generateMFASessionToken(username);

    // Log successful MFA authentication
    mfaService.logMFAAttempt({
      userId: username,
      description: 'MFA authentication successful',
      success: true,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });

    SecurityLogger.info('MFA authentication successful', {
      username: username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'MFA authentication successful',
      data: {
        sessionToken: sessionToken,
        expiresIn: 600 // 10 minutes
      }
    });
    
  } catch (error) {
    SecurityLogger.error('MFA authentication failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_AUTHENTICATION_FAILED'
    });
  }
});

/**
 * Authenticate with backup code
 * POST /api/auth/mfa/backup
 */
router.post('/backup', async (req, res) => {
  try {
    const { username, backupCode, encryptedBackupCodes } = req.body;
    
    if (!username || !backupCode || !encryptedBackupCodes) {
      throw new BaseError('INVALID_REQUEST', 'Username, backup code, and encrypted backup codes are required', 400);
    }

    // Decrypt backup codes
    const backupCodes = mfaService.decryptBackupCodes(encryptedBackupCodes);
    
    // Verify backup code
    const isValid = mfaService.verifyBackupCode(backupCode, backupCodes);
    
    if (!isValid) {
      mfaService.logMFAAttempt({
        userId: username,
        description: 'MFA backup code authentication failed',
        success: false,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      throw new BaseError('INVALID_BACKUP_CODE', 'Invalid backup code', 401);
    }

    // Remove used backup code
    const updatedBackupCodes = mfaService.removeBackupCode(backupCode, backupCodes);
    const encryptedUpdatedBackupCodes = mfaService.encryptBackupCodes(updatedBackupCodes);

    // Generate MFA session token
    const sessionToken = mfaService.generateMFASessionToken(username);

    // Log successful backup code authentication
    mfaService.logMFAAttempt({
      userId: username,
      description: 'MFA backup code authentication successful',
      success: true,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });

    SecurityLogger.warn('MFA backup code used', {
      username: username,
      remainingBackupCodes: updatedBackupCodes.length,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Backup code authentication successful',
      data: {
        sessionToken: sessionToken,
        expiresIn: 600,
        remainingBackupCodes: updatedBackupCodes.length,
        encryptedBackupCodes: encryptedUpdatedBackupCodes
      }
    });
    
  } catch (error) {
    SecurityLogger.error('MFA backup code authentication failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_BACKUP_AUTHENTICATION_FAILED'
    });
  }
});

/**
 * Disable MFA for user
 * POST /api/auth/mfa/disable
 */
router.post('/disable', async (req, res) => {
  try {
    const { username, token, encryptedSecret } = req.body;
    
    if (!username || !token || !encryptedSecret) {
      throw new BaseError('INVALID_REQUEST', 'Username, token, and secret are required', 400);
    }

    // Decrypt secret
    const secret = mfaService.decryptSecret(encryptedSecret);
    
    // Verify TOTP token
    const isValid = mfaService.verifyTOTP(token, secret);
    
    if (!isValid) {
      throw new BaseError('INVALID_TOKEN', 'Invalid MFA token', 401);
    }

    SecurityLogger.info('MFA disabled for user', {
      username: username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
    
  } catch (error) {
    SecurityLogger.error('MFA disable failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_DISABLE_FAILED'
    });
  }
});

/**
 * Generate new backup codes
 * POST /api/auth/mfa/regenerate-backup-codes
 */
router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const { username, token, encryptedSecret } = req.body;
    
    if (!username || !token || !encryptedSecret) {
      throw new BaseError('INVALID_REQUEST', 'Username, token, and secret are required', 400);
    }

    // Decrypt secret
    const secret = mfaService.decryptSecret(encryptedSecret);
    
    // Verify TOTP token
    const isValid = mfaService.verifyTOTP(token, secret);
    
    if (!isValid) {
      throw new BaseError('INVALID_TOKEN', 'Invalid MFA token', 401);
    }

    // Generate new backup codes
    const newBackupCodes = mfaService.generateBackupCodes();
    const encryptedNewBackupCodes = mfaService.encryptBackupCodes(newBackupCodes);

    SecurityLogger.info('MFA backup codes regenerated', {
      username: username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: newBackupCodes,
        encryptedBackupCodes: encryptedNewBackupCodes
      }
    });
    
  } catch (error) {
    SecurityLogger.error('MFA backup codes regeneration failed', {
      error: error.message,
      username: req.body.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_BACKUP_CODES_REGENERATION_FAILED'
    });
  }
});

/**
 * Check MFA status for user
 * GET /api/auth/mfa/status
 */
router.get('/status', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      throw new BaseError('USERNAME_REQUIRED', 'Username is required', 400);
    }

    // In a real implementation, this would check the database
    // For now, return a mock response
    const mfaStatus = {
      username: username,
      mfaEnabled: false, // This would come from database
      hasBackupCodes: false,
      lastUsed: null
    };

    res.json({
      success: true,
      data: mfaStatus
    });
    
  } catch (error) {
    SecurityLogger.error('MFA status check failed', {
      error: error.message,
      username: req.query.username,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'MFA_STATUS_CHECK_FAILED'
    });
  }
});

module.exports = router;
