import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testStatsQuery() {
  console.log('🔍 Testing fixed stats query...');
  
  try {
    // Test the fixed query with proper spacing
    const { data, error } = await supabase
      .from('gallery_posts')
      .select(`
        count(*) as total_posts,
        count(CASE WHEN file_type = 'image' THEN 1 END) as total_images,
        count(CASE WHEN file_type = 'video' THEN 1 END) as total_videos,
        count(CASE WHEN status = 'approved' THEN 1 END) as approved_posts,
        count(CASE WHEN status = 'pending' THEN 1 END) as pending_posts,
        count(DISTINCT uploader_ip) as unique_uploaders,
        sum(file_size) as total_storage_used,
        avg(file_size) as average_file_size
      `)
      .single();

    if (error) {
      console.error('❌ Stats query failed:', error.message);
    } else {
      console.log('✅ Stats query successful:', data);
    }
    
  } catch (err) {
    console.error('❌ Error testing stats:', err.message);
  }
}

testStatsQuery();
