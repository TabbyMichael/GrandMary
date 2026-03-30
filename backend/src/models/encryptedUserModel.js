const encryptionService = require('../services/encryptionService.js');

class EncryptedUserModel {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email_encrypted = this.encryptEmail(userData.email);
    this.phone_encrypted = userData.phone ? this.encryptPhone(userData.phone) : null;
    this.full_name_encrypted = userData.fullName ? this.encrypt(userData.fullName) : null;
    this.relationship_encrypted = userData.relationship ? this.encrypt(userData.relationship) : null;
    this.created_at = userData.createdAt || new Date().toISOString();
    this.updated_at = userData.updatedAt || new Date().toISOString();
  }

  encryptEmail(email) {
    if (!email) return null;
    try {
      return encryptionService.encryptEmail(email);
    } catch (error) {
      console.error('Failed to encrypt email:', error.message);
      return null;
    }
  }

  encryptPhone(phone) {
    if (!phone) return null;
    try {
      return encryptionService.encryptPhone(phone);
    } catch (error) {
      console.error('Failed to encrypt phone:', error.message);
      return null;
    }
  }

  encrypt(text) {
    if (!text) return null;
    try {
      return encryptionService.encrypt(text);
    } catch (error) {
      console.error('Failed to encrypt text:', error.message);
      return null;
    }
  }

  // Get decrypted data (use carefully)
  getEmail() {
    if (!this.email_encrypted) return null;
    try {
      return encryptionService.decryptEmail(this.email_encrypted);
    } catch (error) {
      console.error('Failed to decrypt email:', error.message);
      return null;
    }
  }

  getPhone() {
    if (!this.phone_encrypted) return null;
    try {
      return encryptionService.decryptPhone(this.phone_encrypted);
    } catch (error) {
      console.error('Failed to decrypt phone:', error.message);
      return null;
    }
  }

  getFullName() {
    if (!this.full_name_encrypted) return null;
    try {
      return encryptionService.decrypt(this.full_name_encrypted);
    } catch (error) {
      console.error('Failed to decrypt full name:', error.message);
      return null;
    }
  }

  getRelationship() {
    if (!this.relationship_encrypted) return null;
    try {
      return encryptionService.decrypt(this.relationship_encrypted);
    } catch (error) {
      console.error('Failed to decrypt relationship:', error.message);
      return null;
    }
  }

  // Get safe data for API responses (no PII)
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      created_at: this.created_at,
      updated_at: this.updated_at,
      has_email: !!this.email_encrypted,
      has_phone: !!this.phone_encrypted,
      has_full_name: !!this.full_name_encrypted
    };
  }

  // Get full data for admin access (with decrypted PII)
  toAdminObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.getEmail(),
      phone: this.getPhone(),
      full_name: this.getFullName(),
      relationship: this.getRelationship(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Convert to database format
  toDatabaseObject() {
    return {
      id: this.id,
      username: this.username,
      email_encrypted: JSON.stringify(this.email_encrypted),
      phone_encrypted: this.phone_encrypted ? JSON.stringify(this.phone_encrypted) : null,
      full_name_encrypted: this.full_name_encrypted ? JSON.stringify(this.full_name_encrypted) : null,
      relationship_encrypted: this.relationship_encrypted ? JSON.stringify(this.relationship_encrypted) : null,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Create from database format
  static fromDatabaseObject(dbData) {
    const userData = {
      id: dbData.id,
      username: dbData.username,
      email: dbData.email_encrypted ? JSON.parse(dbData.email_encrypted) : null,
      phone: dbData.phone_encrypted ? JSON.parse(dbData.phone_encrypted) : null,
      fullName: dbData.full_name_encrypted ? JSON.parse(dbData.full_name_encrypted) : null,
      relationship: dbData.relationship_encrypted ? JSON.parse(dbData.relationship_encrypted) : null,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };

    return new EncryptedUserModel(userData);
  }
}

module.exports = EncryptedUserModel;
