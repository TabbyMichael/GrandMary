import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client (for service operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Database configuration
export const dbConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceRoleKey: supabaseServiceRoleKey,
  primary: process.env.DB_PRIMARY || 'supabase',
  fallbackEnabled: process.env.DB_FALLBACK_ENABLED === 'true',
  fallbackPath: process.env.DB_PATH || './database/everbloom.db'
};

// Table names
export const tables = {
  tributes: 'tributes',
  candles: 'candles',
  gallery_posts: 'gallery_posts',
  users: 'users',
  comments: 'comments',
  reactions: 'reactions'
};

// Export configuration
export default {
  supabase,
  supabaseAdmin,
  dbConfig,
  tables
};
