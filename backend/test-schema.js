import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking gallery_posts table schema...');
  
  try {
    // Try to select all columns to see what exists
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema check failed:', error.message);
    } else {
      if (data && data.length > 0) {
        console.log('✅ Sample record columns:', Object.keys(data[0]));
        console.log('📋 Sample data:', data[0]);
      } else {
        console.log('ℹ️  No records in gallery_posts table');
        
        // Try to get column information by attempting different queries
        const columns = ['id', 'title', 'caption', 'file_type', 'file_path', 'file_name', 'uploader_name', 'is_public', 'status', 'created_at', 'updated_at'];
        
        for (const column of columns) {
          try {
            const { data, error } = await supabase
              .from('gallery_posts')
              .select(column)
              .limit(1);
            
            if (!error) {
              console.log(`✅ Column exists: ${column}`);
            }
          } catch (err) {
            console.log(`❌ Column missing: ${column}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Schema check error:', err.message);
  }
}

checkSchema();
