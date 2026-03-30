import dotenv from 'dotenv';
import databaseService from './src/services/databaseService.js';

dotenv.config();

async function testDatabaseService() {
  console.log('Testing DatabaseService...');
  
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
    console.log('🔄 Testing insertPost operation...');
    const result = await databaseService.executeWithFallback('insertPost', { traceId: 'test-trace' }, postData);
    console.log('✅ DatabaseService insert successful:', result);
    
    // Clean up
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('gallery_posts').delete().eq('id', result.id);
    console.log('🧹 Test record cleaned up');
    
  } catch (error) {
    console.error('❌ DatabaseService insert failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabaseService();
