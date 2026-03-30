import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('Checking Supabase tables...');
  
  // Check if gallery_posts table exists
  try {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ gallery_posts table error:', error.message);
    } else {
      console.log('✅ gallery_posts table exists:', data);
    }
  } catch (err) {
    console.error('❌ gallery_posts table check failed:', err.message);
  }
  
  // Check if tributes table exists
  try {
    const { data, error } = await supabase
      .from('tributes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ tributes table error:', error.message);
    } else {
      console.log('✅ tributes table exists:', data);
    }
  } catch (err) {
    console.error('❌ tributes table check failed:', err.message);
  }
  
  // List all tables (if possible)
  try {
    const { data, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      console.log('ℹ️  Cannot list tables (RPC not available)');
    } else {
      console.log('📋 Available tables:', data);
    }
  } catch (err) {
    console.log('ℹ️  Cannot list tables');
  }
}

checkTables();
