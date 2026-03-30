import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSimpleStats() {
  console.log('🔍 Testing simple stats queries...');
  
  try {
    // Test basic count first
    const { data: totalCount, error: countError } = await supabase
      .from('gallery_posts')
      .select('count')
      .single();

    if (countError) {
      console.error('❌ Count query failed:', countError.message);
    } else {
      console.log('✅ Total posts:', totalCount);
    }
    
    // Test image count
    const { data: imageCount, error: imageError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('file_type', 'image')
      .single();

    if (imageError) {
      console.error('❌ Image count failed:', imageError.message);
    } else {
      console.log('✅ Image posts:', imageCount);
    }
    
    // Test approved posts
    const { data: approvedCount, error: approvedError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('status', 'approved')
      .single();

    if (approvedError) {
      console.error('❌ Approved count failed:', approvedError.message);
    } else {
      console.log('✅ Approved posts:', approvedCount);
    }
    
  } catch (err) {
    console.error('❌ Error testing stats:', err.message);
  }
}

testSimpleStats();
