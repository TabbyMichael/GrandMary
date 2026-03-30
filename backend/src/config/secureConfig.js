import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

class SecureConfig {
  constructor() {
    this.validateRequiredSecrets();
    this.ensureStrongSecrets();
  }
  
  validateRequiredSecrets() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  ensureStrongSecrets() {
    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length < 32 || jwtSecret.includes('change-this') || jwtSecret.includes('your-super-secret')) {
      throw new Error('JWT_SECRET must be a strong, unique secret (minimum 32 characters)');
    }
    
    // Check admin password strength
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword.length < 12 || adminPassword.includes('change-this')) {
      throw new Error('ADMIN_PASSWORD must be a strong password (minimum 12 characters)');
    }
  }
  
  get(key) {
    const value = process.env[key];
    
    if (!value) {
      throw new Error(`Configuration key '${key}' not found`);
    }
    
    return value;
  }
  
  getSupabaseConfig() {
    return {
      url: this.get('SUPABASE_URL'),
      anonKey: this.get('SUPABASE_ANON_KEY'),
      serviceRoleKey: this.get('SUPABASE_SERVICE_ROLE_KEY')
    };
  }
  
  getJWTConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      expiresIn: '24h'
    };
  }
  
  getAdminConfig() {
    return {
      username: this.get('ADMIN_USERNAME'),
      password: this.get('ADMIN_PASSWORD')
    };
  }
  
  getDatabaseConfig() {
    return {
      primary: this.get('DB_PRIMARY') || 'supabase',
      fallbackEnabled: this.get('DB_FALLBACK_ENABLED') === 'true',
      sqlitePath: this.get('DB_PATH') || './database/everbloom.db'
    };
  }
  
  generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }
}

export const secureConfig = new SecureConfig();
export default secureConfig;
