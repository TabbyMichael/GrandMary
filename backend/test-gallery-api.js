import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testGalleryAPI() {
  console.log('🔍 Testing gallery API response...');
  
  try {
    // Test the exact API endpoint the frontend calls
    const { data, error } = await supabase
      .from('gallery_posts')
      .select(`
        id,
        title,
        caption,
        file_name,
        original_file_name,
        file_type,
        mime_type,
        file_size,
        file_path,
        thumbnail_path,
        tags,
        is_public,
        status,
        created_at,
        updated_at,
        event_date,
        location,
        uploader_name,
        uploader_relationship
      `)
      .eq('status', 'approved')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ API test failed:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️  No approved posts found');
      return;
    }
    
    console.log(`📊 API Response for ${data.length} posts:`);
    
    data.forEach((post, index) => {
      console.log(`\n   ${index + 1}. "${post.title}"`);
      console.log(`      file_name: "${post.file_name}"`);
      console.log(`      file_path: "${post.file_path}"`);
      console.log(`      file_type: "${post.file_type}"`);
      console.log(`      status: "${post.status}"`);
      console.log(`      Expected URL: http://localhost:3001/uploads/gallery/${post.file_name}`);
      console.log(`      Alternative URL: http://localhost:3001/uploads/gallery/${post.file_path?.split('\\').pop()}`);
    });
    
  } catch (err) {
    console.error('❌ Error testing API:', err.message);
  }
}

testGalleryAPI();
