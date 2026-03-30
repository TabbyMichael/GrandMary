import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanNullPosts() {
  console.log('🧹 Cleaning posts with null titles...');
  
  try {
    // First, find posts with null titles
    const { data: nullPosts, error: fetchError } = await supabase
      .from('gallery_posts')
      .select('id, uploader_name, title')
      .is('title', null);
    
    if (fetchError) {
      console.error('❌ Error fetching null posts:', fetchError.message);
      return;
    }
    
    if (!nullPosts || nullPosts.length === 0) {
      console.log('ℹ️  No null posts found to clean');
      return;
    }
    
    console.log(`📋 Found ${nullPosts.length} posts with null titles to remove:`);
    
    nullPosts.forEach(post => {
      console.log(`   🗑️  Post ID: ${post.id} by ${post.uploader_name}`);
    });
    
    // Delete the null posts
    const { data: deletedPosts, error: deleteError } = await supabase
      .from('gallery_posts')
      .delete()
      .in('id', nullPosts.map(p => p.id))
      .select();
    
    if (deleteError) {
      console.error('❌ Error deleting null posts:', deleteError.message);
      return;
    }
    
    console.log(`✅ Successfully removed ${deletedPosts?.length || 0} null posts`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

cleanNullPosts();
