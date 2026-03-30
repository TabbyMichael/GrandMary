import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Test with both anon and service role keys
const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  console.log('Testing insert operations...');
  
  const testData = {
    title: 'Test Post',
    caption: 'Test caption',
    file_type: 'image',
    file_url: 'https://example.com/test.jpg',
    uploader_name: 'Test User',
    is_public: true,
    status: 'approved'
  };
  
  // Test with anon key
  console.log('\n🔑 Testing with ANON key:');
  try {
    const { data, error } = await supabaseAnon
      .from('gallery_posts')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ Anon insert failed:', error.message);
    } else {
      console.log('✅ Anon insert successful:', data);
    }
  } catch (err) {
    console.error('❌ Anon insert error:', err.message);
  }
  
  // Test with service role key
  console.log('\n🔑 Testing with SERVICE ROLE key:');
  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ Service role insert failed:', error.message);
    } else {
      console.log('✅ Service role insert successful:', data);
    }
  } catch (err) {
    console.error('❌ Service role insert error:', err.message);
  }
}

testInsert();
