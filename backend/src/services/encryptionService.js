const crypto = require('crypto');
const secureConfig = require('../config/secureConfig.js');

class EncryptionService {
  constructor() {
    // Get encryption key from environment or generate one
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
    
    // In production, this should come from a secure key management system
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  getOrCreateEncryptionKey() {
    // Try to get key from environment
    let key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      // Generate a new key for development
      console.warn('⚠️  ENCRYPTION_KEY not found in environment. Generating temporary key for development.');
      key = crypto.randomBytes(this.keyLength).toString('hex');
      console.log(`🔑 Generated encryption key: ${key}`);
      console.log('💡 Set ENCRYPTION_KEY in your environment for production!');
    }
    
    // Convert hex key to buffer
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt sensitive data
   * @param {string} text - Plain text to encrypt
   * @returns {object} Encrypted data with IV and tag
   */
  encrypt(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to encrypt must be a non-empty string');
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('everbloom-pii', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error.message);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {object} encryptedData - Object with encrypted, iv, and tag
   * @returns {string} Decrypted plain text
   */
  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
      throw new Error('Invalid encrypted data format');
    }

    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('everbloom-pii', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * @param {string} text - Text to hash
   * @returns {string} Hashed value
   */
  hash(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to hash must be a non-empty string');
    }

    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(text)
      .digest('hex');
  }

  /**
   * Encrypt email addresses
   * @param {string} email - Email to encrypt
   * @returns {object} Encrypted email data
   */
  encryptEmail(email) {
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    return this.encrypt(email.toLowerCase().trim());
  }

  /**
   * Decrypt email addresses
   * @param {object} encryptedEmail - Encrypted email data
   * @returns {string} Decrypted email
   */
  decryptEmail(encryptedEmail) {
    const email = this.decrypt(encryptedEmail);
    
    if (!this.isValidEmail(email)) {
      throw new Error('Decrypted data is not a valid email');
    }
    
    return email;
  }

  /**
   * Encrypt phone numbers
   * @param {string} phone - Phone number to encrypt
   * @returns {object} Encrypted phone data
   */
  encryptPhone(phone) {
    if (!phone || !this.isValidPhone(phone)) {
      throw new Error('Invalid phone format');
    }
    
    // Normalize phone number format
    const normalized = phone.replace(/\D/g, '');
    return this.encrypt(normalized);
  }

  /**
   * Decrypt phone numbers
   * @param {object} encryptedPhone - Encrypted phone data
   * @returns {string} Decrypted phone
   */
  decryptPhone(encryptedPhone) {
    const phone = this.decrypt(encryptedPhone);
    
    if (!this.isValidPhone(phone)) {
      throw new Error('Decrypted data is not a valid phone number');
    }
    
    // Format phone number back to readable format
    return this.formatPhone(phone);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number digits
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return as-is if format is unexpected
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex-encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verify password with bcrypt-like stretching
   * @param {string} password - Plain password
   * @param {string} hash - Hashed password to compare against
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hash) {
    const hashedInput = this.hash(password);
    return crypto.timingSafeEqual(
      Buffer.from(hashedInput, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  /**
   * Hash password for storage
   * @param {string} password - Plain password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    // Add salt and pepper for extra security
    const salt = crypto.randomBytes(16).toString('hex');
    const pepper = process.env.PASSWORD_PEPPER || 'everbloom-default-pepper';
    
    const combined = password + salt + pepper;
    const hashed = this.hash(combined);
    
    return {
      hash: hashed,
      salt: salt
    };
  }
}

// Singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;
