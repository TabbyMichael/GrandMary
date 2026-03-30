import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function approvePendingPosts() {
  console.log('🔍 Approving pending posts...');
  
  try {
    // Get pending posts
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('gallery_posts')
      .select('id, file_name, title, status')
      .eq('status', 'pending');
    
    if (fetchError) {
      console.error('❌ Error fetching pending posts:', fetchError.message);
      return;
    }
    
    if (!pendingPosts || pendingPosts.length === 0) {
      console.log('ℹ️  No pending posts found');
      return;
    }
    
    console.log(`📋 Found ${pendingPosts.length} pending posts to approve:`);
    
    pendingPosts.forEach(post => {
      console.log(`   📝 "${post.title || 'Untitled'}" (${post.file_name})`);
    });
    
    // Update pending posts to approved
    const { data: updatedPosts, error: updateError } = await supabase
      .from('gallery_posts')
      .update({ 
        status: 'approved',
        title: post => post.title || 'Beautiful Memory' // Give a default title if null
      })
      .eq('status', 'pending')
      .select();
    
    if (updateError) {
      console.error('❌ Error approving posts:', updateError.message);
      return;
    }
    
    console.log(`✅ Successfully approved ${updatedPosts?.length || 0} posts`);
    
    // Show updated posts
    updatedPosts?.forEach(post => {
      console.log(`   ✅ "${post.title}" by ${post.uploader_name}`);
    });
    
  } catch (err) {
    console.error('❌ Error during approval:', err.message);
  }
}

approvePendingPosts();
