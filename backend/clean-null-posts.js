import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanNullPosts() {
  console.log('🧹 Cleaning posts with null titles...');
  
  try {
    // Remove posts with null or empty titles
    const { data: nullPosts, error } = await supabase
      .from('gallery_posts')
      .delete()
      .or('title.is.null,title.eq(\'\'),caption.is.null,caption.eq(\'\')')
      .select();
    
    if (error) {
      console.error('❌ Error fetching null posts:', error.message);
      return;
    }
    
    if (!nullPosts || nullPosts.length === 0) {
      console.log('ℹ️  No null posts found to clean');
      return;
    }
    
    console.log(`📋 Found ${nullPosts.length} posts with null/empty content to remove:`);
    
    nullPosts.forEach(post => {
      console.log(`   🗑️  Post ID: ${post.id} by ${post.uploader_name}`);
    });
    
    console.log(`✅ Successfully removed ${nullPosts.length} null posts`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

cleanNullPosts();
