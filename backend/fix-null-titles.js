import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixNullTitles() {
  console.log('🔧 Fixing null titles...');
  
  try {
    // Update posts with null titles
    const { data: updatedPosts, error } = await supabase
      .from('gallery_posts')
      .update({ title: 'Beautiful Memory' })
      .is('title', null)
      .select();
    
    if (error) {
      console.error('❌ Error fixing titles:', error.message);
      return;
    }
    
    if (!updatedPosts || updatedPosts.length === 0) {
      console.log('ℹ️  No null titles found to fix');
      return;
    }
    
    console.log(`✅ Fixed ${updatedPosts.length} null titles:`);
    
    updatedPosts.forEach(post => {
      console.log(`   📝 Updated: "${post.title}" (ID: ${post.id})`);
    });
    
  } catch (err) {
    console.error('❌ Error fixing titles:', err.message);
  }
}

fixNullTitles();
