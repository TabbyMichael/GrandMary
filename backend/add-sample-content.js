import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addSampleContent() {
  console.log('🎨 Adding sample gallery content...');
  
  try {
    // Add a sample image post
    const imagePost = {
      uploader_name: 'Sarah Johnson',
      uploader_relationship: 'Daughter',
      uploader_ip: '::1',
      title: 'Family Gathering',
      caption: 'A beautiful moment with family, creating memories that will last forever.',
      file_name: '32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg',
      original_file_name: 'family-gathering.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      file_size: 184175,
      file_path: 'gallery/32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg',
      thumbnail_path: null,
      tags: ['Family', 'Love', 'Memories'],
      is_public: true,
      status: 'approved',
      event_date: '2024-06-15',
      location: 'Nairobi, Kenya'
    };
    
    const { data: imageResult, error: imageError } = await supabase
      .from('gallery_posts')
      .insert([imagePost])
      .select();
    
    if (imageError) {
      console.error('❌ Error adding image post:', imageError.message);
    } else {
      console.log('✅ Image post added:', imageResult[0]?.title);
    }
    
    // Add a video placeholder (we don't have actual video files, but we can add the metadata)
    const videoPost = {
      uploader_name: 'Michael Wangui',
      uploader_relationship: 'Son',
      uploader_ip: '::1',
      title: 'Mother\'s Birthday Video',
      caption: 'A special video message for mom\'s 75th birthday celebration.',
      file_name: '6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg', // Using existing image as placeholder
      original_file_name: 'birthday-celebration.mp4',
      file_type: 'video',
      mime_type: 'video/mp4',
      file_size: 2048576,
      file_path: 'gallery/6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg',
      thumbnail_path: null,
      tags: ['Birthday', 'Celebration', 'Family'],
      is_public: true,
      status: 'approved',
      event_date: '2024-03-20',
      location: 'Nairobi, Kenya'
    };
    
    const { data: videoResult, error: videoError } = await supabase
      .from('gallery_posts')
      .insert([videoPost])
      .select();
    
    if (videoError) {
      console.error('❌ Error adding video post:', videoError.message);
    } else {
      console.log('✅ Video post added:', videoResult[0]?.title);
    }
    
    // Add another memory post
    const memoryPost = {
      uploader_name: 'Grace Kariuki',
      uploader_relationship: 'Granddaughter',
      uploader_ip: '::1',
      title: 'Garden Memories',
      caption: 'Grandma Mary in her beloved garden, surrounded by the flowers she tended with so much love.',
      file_name: '6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg',
      original_file_name: 'garden-memories.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      file_size: 156789,
      file_path: 'gallery/6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg',
      thumbnail_path: null,
      tags: ['Garden', 'Nature', 'Love', 'Grandma'],
      is_public: true,
      status: 'approved',
      event_date: '2024-05-10',
      location: 'Home Garden'
    };
    
    const { data: memoryResult, error: memoryError } = await supabase
      .from('gallery_posts')
      .insert([memoryPost])
      .select();
    
    if (memoryError) {
      console.error('❌ Error adding memory post:', memoryError.message);
    } else {
      console.log('✅ Memory post added:', memoryResult[0]?.title);
    }
    
    // Verify all posts
    const { data: allPosts, error: fetchError } = await supabase
      .from('gallery_posts')
      .select('title, file_type, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching posts:', fetchError.message);
    } else {
      console.log(`\n📊 Gallery now has ${allPosts.length} approved posts:`);
      allPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.title}" (${post.file_type})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error adding sample content:', err.message);
  }
}

addSampleContent();
