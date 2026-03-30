import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkGalleryPosts() {
  console.log('🔍 Checking gallery posts...');
  
  try {
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select('id, title, file_name, file_path, file_type, status')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching posts:', error.message);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('ℹ️  No posts found');
      return;
    }
    
    console.log(`📊 Found ${posts.length} posts:`);
    
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}"`);
      console.log(`      File name: ${post.file_name}`);
      console.log(`      File path: ${post.file_path}`);
      console.log(`      File type: ${post.file_type}`);
      console.log(`      Status: ${post.status}`);
      console.log(`      Expected URL: http://localhost:3001/uploads/gallery/${post.file_name}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('❌ Error checking posts:', err.message);
  }
}

checkGalleryPosts();
