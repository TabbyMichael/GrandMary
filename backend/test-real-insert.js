import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRealInsert() {
  console.log('Testing real insert with correct schema...');
  
  const postData = {
    uploader_name: 'Test User',
    uploader_relationship: null,
    uploader_ip: '::1',
    title: 'Test Upload',
    caption: 'Test caption',
    file_name: 'test-file.jpg',
    original_file_name: 'test-file.jpg',
    file_type: 'image',
    mime_type: 'image/jpeg',
    file_size: 1024,
    file_path: 'gallery/test-file.jpg',
    thumbnail_path: null,
    tags: [],
    is_public: true,
    status: 'approved',
    event_date: null,
    location: null
  };
  
  try {
    const { data, error } = await supabase
      .from('gallery_posts')
      .insert([postData])
      .select();
    
    if (error) {
      console.error('❌ Real insert failed:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Real insert successful:', data);
      
      // Clean up - delete the test record
      if (data && data[0]) {
        await supabase
          .from('gallery_posts')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
  } catch (err) {
    console.error('❌ Real insert error:', err.message);
  }
}

testRealInsert();
