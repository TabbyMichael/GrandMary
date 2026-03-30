import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyGalleryClean() {
  console.log('🔍 Verifying gallery is clean...');
  
  try {
    // Get all posts
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select('id, title, uploader_name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching posts:', error.message);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('✅ Gallery is completely empty');
      return;
    }
    
    console.log(`📊 Gallery contains ${posts.length} posts:`);
    
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}" by ${post.uploader_name} (${new Date(post.created_at).toLocaleDateString()})`);
    });
    
    // Check for any remaining sample/test data
    const sampleUploaders = ['Sarah Johnson', 'Michael Wangui', 'Grace Kariuki', 'Test User', 'Ian'];
    const remainingSamples = posts.filter(post => sampleUploaders.includes(post.uploader_name));
    
    if (remainingSamples.length > 0) {
      console.log(`⚠️  ${remainingSamples.length} sample/test posts still remain:`);
      remainingSamples.forEach(post => {
        console.log(`   🗑️  "${post.title}" by ${post.uploader_name}`);
      });
    } else {
      console.log('✅ No sample or test data remaining');
    }
    
  } catch (err) {
    console.error('❌ Error during verification:', err.message);
  }
}

verifyGalleryClean();
