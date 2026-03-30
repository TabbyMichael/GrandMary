import dotenv from 'dotenv';
import { supabaseAdmin } from './src/supabase-config.js';

dotenv.config();

async function testAdminClient() {
  console.log('Testing supabaseAdmin client...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
  
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
    console.log('🔄 Testing insert with supabaseAdmin...');
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .insert([postData])
      .select();
    
    if (error) {
      console.error('❌ supabaseAdmin insert failed:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ supabaseAdmin insert successful:', data);
      
      // Clean up
      await supabaseAdmin
        .from('gallery_posts')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test record cleaned up');
    }
  } catch (err) {
    console.error('❌ supabaseAdmin insert error:', err.message);
    console.error('Stack:', err.stack);
  }
}

testAdminClient();
