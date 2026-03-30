const crypto = require('crypto');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
const encryptionService = require('./encryptionService.js');

class MFAService {
  constructor() {
    this.appName = 'Everbloom Memorial Platform';
    this.issuer = 'everbloom-memorial';
    this.window = 1; // Allow 1 step before/after for time drift
  }

  /**
   * Generate a new TOTP secret for a user
   * @param {string} username - User's username
   * @returns {object} Secret and QR code data
   */
  generateSecret(username) {
    // Generate a secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: `${this.issuer}:${username}`,
      issuer: this.appName,
      length: 32
    });
    
    return {
      secret: secret.base32,
      totpUri: secret.otpauth_url,
      backupCodes: this.generateBackupCodes()
    };
  }

  /**
   * Generate TOTP URI for QR code
   * @param {string} username - User's username
   * @param {string} secret - TOTP secret
   * @returns {string} TOTP URI
   */
  generateTOTPUri(username, secret) {
    return `otpauth://totp/${this.issuer}:${username}?secret=${secret}&issuer=${this.appName}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generate QR code image as data URL
   * @param {string} totpUri - TOTP URI
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCode(totpUri) {
    try {
      const qrDataUrl = await qrcode.toDataURL(totpUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate backup codes for MFA
   * @param {number} count - Number of backup codes to generate
   * @returns {array} Array of backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify TOTP token
   * @param {string} token - 6-digit TOTP token
   * @param {string} secret - User's TOTP secret
   * @returns {boolean} True if token is valid
   */
  verifyTOTP(token, secret) {
    if (!token || !secret) {
      return false;
    }

    // Validate token format
    if (!/^\d{6}$/.test(token)) {
      return false;
    }

    try {
      // Use speakeasy for TOTP verification
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: this.window,
        time: Math.floor(Date.now() / 1000)
      });
      
      return verified;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate TOTP token for given time counter
   * @param {string} secret - TOTP secret
   * @param {number} counter - Time counter
   * @returns {string} 6-digit TOTP token
   */
  generateTOTPToken(secret, counter) {
    // Convert secret to buffer
    const secretBuffer = Buffer.from(secret, 'base64');
    
    // Convert counter to 8-byte buffer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
    
    // Generate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();
    
    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0x0F;
    const binaryCode = 
      ((hmacResult[offset] & 0x7F) << 24) |
      ((hmacResult[offset + 1] & 0xFF) << 16) |
      ((hmacResult[offset + 2] & 0xFF) << 8) |
      (hmacResult[offset + 3] & 0xFF);
    
    // Generate 6-digit code
    return String(binaryCode % 1000000).padStart(6, '0');
  }

  /**
   * Verify backup code
   * @param {string} code - Backup code to verify
   * @param {array} backupCodes - User's backup codes
   * @returns {boolean} True if code is valid
   */
  verifyBackupCode(code, backupCodes) {
    if (!code || !Array.isArray(backupCodes)) {
      return false;
    }

    // Normalize code format
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
    
    return backupCodes.includes(normalizedCode);
  }

  /**
   * Remove used backup code
   * @param {string} code - Used backup code
   * @param {array} backupCodes - User's backup codes
   * @returns {array} Updated backup codes
   */
  removeBackupCode(code, backupCodes) {
    if (!code || !Array.isArray(backupCodes)) {
      return backupCodes;
    }

    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
    return backupCodes.filter(c => c !== normalizedCode);
  }

  /**
   * Encrypt MFA secret for storage
   * @param {string} secret - TOTP secret
   * @returns {object} Encrypted secret data
   */
  encryptSecret(secret) {
    return encryptionService.encrypt(secret);
  }

  /**
   * Decrypt MFA secret for verification
   * @param {object} encryptedSecret - Encrypted secret data
   * @returns {string} Decrypted secret
   */
  decryptSecret(encryptedSecret) {
    return encryptionService.decrypt(encryptedSecret);
  }

  /**
   * Encrypt backup codes for storage
   * @param {array} backupCodes - Array of backup codes
   * @returns {object} Encrypted backup codes data
   */
  encryptBackupCodes(backupCodes) {
    return encryptionService.encrypt(JSON.stringify(backupCodes));
  }

  /**
   * Decrypt backup codes for verification
   * @param {object} encryptedBackupCodes - Encrypted backup codes data
   * @returns {array} Decrypted backup codes
   */
  decryptBackupCodes(encryptedBackupCodes) {
    const decrypted = encryptionService.decrypt(encryptedBackupCodes);
    return JSON.parse(decrypted);
  }

  /**
   * Constant-time comparison to prevent timing attacks
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings are equal
   */
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate MFA session token
   * @param {string} userId - User ID
   * @returns {object} Session token data
   */
  generateMFASessionToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return {
      token: token,
      userId: userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Verify MFA session token
   * @param {object} sessionData - Session token data
   * @returns {boolean} True if token is valid
   */
  verifyMFASessionToken(sessionData) {
    if (!sessionData || !sessionData.token || !sessionData.expiresAt) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    
    return now < expiresAt;
  }

  /**
   * Generate SMS verification code
   * @returns {string} 6-digit verification code
   */
  generateSMSCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash SMS code for storage
   * @param {string} code - SMS verification code
   * @returns {string} Hashed code
   */
  hashSMSCode(code) {
    return encryptionService.hash(code);
  }

  /**
   * Verify SMS code
   * @param {string} code - Provided code
   * @param {string} hashedCode - Stored hashed code
   * @returns {boolean} True if code is valid
   */
  verifySMSCode(code, hashedCode) {
    return encryptionService.verifyPassword(code, hashedCode);
  }

  /**
   * Check if user should be prompted for MFA
   * @param {object} user - User object
   * @param {object} request - Request object
   * @returns {boolean} True if MFA should be required
   */
  shouldRequireMFA(user, request) {
    // Always require MFA for admin users
    if (user.role === 'admin') {
      return true;
    }

    // Require MFA for sensitive operations
    const sensitiveEndpoints = [
      '/api/admin',
      '/api/users/delete',
      '/api/gallery/approve',
      '/api/tributes/delete'
    ];

    const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
      request.path.startsWith(endpoint)
    );

    // Require MFA if user has it enabled and it's a sensitive operation
    return user.mfa_enabled && isSensitiveEndpoint;
  }

  /**
   * Log MFA attempt for security monitoring
   * @param {object} logData - Log data
   */
  logMFAAttempt(logData) {
    const logEntry = {
      event_type: 'mfa_attempt',
      user_id: logData.userId,
      event_description: logData.description,
      severity: logData.success ? 'low' : 'medium',
      ip_address: logData.ip,
      user_agent: logData.userAgent,
      endpoint: logData.endpoint,
      method: logData.method,
      created_at: new Date().toISOString()
    };

    console.log('🔐 MFA Attempt:', JSON.stringify(logEntry));
    
    // In production, this would be stored in the security_events table
    return logEntry;
  }
}

// Singleton instance
const mfaService = new MFAService();

module.exports = mfaService;
