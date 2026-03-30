import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment Variables Debug:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
console.log('DB_PRIMARY:', process.env.DB_PRIMARY);

// Test Supabase connection using environment variables
import { createClient } from '@supabase/supabase-js';

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('tributes').select('count').limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('✅ Supabase connection successful:', data);
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
} else {
  console.error('❌ Missing required environment variables');
}
