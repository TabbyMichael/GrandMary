import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanSampleData() {
  console.log('🧹 Cleaning sample data from gallery...');
  
  try {
    // Get all sample posts
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select('*')
      .in('uploader_name', ['Sarah Johnson', 'Michael Wangui', 'Grace Kariuki']);
    
    if (error) {
      console.error('❌ Error fetching sample data:', error.message);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('ℹ️  No sample data found to clean');
      return;
    }
    
    console.log(`📋 Found ${posts.length} sample posts to remove:`);
    
    // Display posts to be removed
    posts.forEach(post => {
      console.log(`   🗑️  "${post.title}" by ${post.uploader_name}`);
    });
    
    // Delete sample posts
    const { data: deletedPosts, error: deleteError } = await supabase
      .from('gallery_posts')
      .delete()
      .in('uploader_name', ['Sarah Johnson', 'Michael Wangui', 'Grace Kariuki'])
      .select();
    
    if (deleteError) {
      console.error('❌ Error deleting sample data:', deleteError.message);
      return;
    }
    
    console.log(`✅ Successfully removed ${deletedPosts?.length || 0} sample posts`);
    
    // Verify cleanup
    const { data: remainingPosts, error: verifyError } = await supabase
      .from('gallery_posts')
      .select('count')
      .in('uploader_name', ['Sarah Johnson', 'Michael Wangui', 'Grace Kariuki']);
    
    if (!verifyError && remainingPosts) {
      const count = remainingPosts[0]?.count || 0;
      if (count === 0) {
        console.log('✅ All sample data successfully removed');
      } else {
        console.log(`⚠️  ${count} sample posts remaining`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

cleanSampleData();
