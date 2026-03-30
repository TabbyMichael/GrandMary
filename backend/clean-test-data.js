import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanTestData() {
  console.log('🧹 Cleaning test data from gallery...');
  
  try {
    // Remove test posts
    const { data: testPosts, error } = await supabase
      .from('gallery_posts')
      .delete()
      .in('uploader_name', ['Test User', 'Ian Kamau', 'Ian'])
      .or('title.ilike.%Test%,caption.ilike.%Test%')
      .select();
    
    if (error) {
      console.error('❌ Error fetching test data:', error.message);
      return;
    }
    
    if (!testPosts || testPosts.length === 0) {
      console.log('ℹ️  No test data found to clean');
      return;
    }
    
    console.log(`📋 Found ${testPosts.length} test posts to remove:`);
    
    // Display posts to be removed
    testPosts.forEach(post => {
      console.log(`   🗑️  "${post.title}" by ${post.uploader_name}`);
    });
    
    console.log(`✅ Successfully removed ${testPosts.length} test posts`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

cleanTestData();
