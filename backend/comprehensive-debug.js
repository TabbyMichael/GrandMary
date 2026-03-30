import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function comprehensiveDebug() {
  console.log('🔍 COMPREHENSIVE GALLERY DEBUG');
  console.log('================================');
  
  // 1. Check database posts
  console.log('\n1. 📊 DATABASE POSTS:');
  try {
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }
    
    console.log(`   Found ${posts.length} approved posts:`);
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}" (${post.file_type})`);
      console.log(`      File: ${post.file_name}`);
      console.log(`      URL: http://localhost:3001/uploads/gallery/${post.file_name}`);
      console.log(`      Status: ${post.status} | Public: ${post.is_public}`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
  }
  
  // 2. Test API endpoint
  console.log('2. 🌐 API ENDPOINT TEST:');
  try {
    const response = await fetch('http://localhost:3001/api/gallery/posts');
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Posts returned: ${data.posts?.length || 0}`);
    
    if (data.posts && data.posts.length > 0) {
      console.log('   First post structure:');
      const post = data.posts[0];
      Object.keys(post).forEach(key => {
        console.log(`      ${key}: ${post[key]}`);
      });
    }
  } catch (err) {
    console.error('❌ API test failed:', err.message);
  }
  
  // 3. Test image access
  console.log('3. 🖼️ IMAGE ACCESS TEST:');
  try {
    const response = await fetch('http://localhost:3001/uploads/gallery/32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
  } catch (err) {
    console.error('❌ Image test failed:', err.message);
  }
  
  // 4. Check CSP
  console.log('4. 🛡️ CSP HEADERS:');
  try {
    const response = await fetch('http://localhost:3001/api/gallery/posts');
    const csp = response.headers.get('content-security-policy');
    console.log(`   CSP: ${csp}`);
    
    const imgSrc = csp?.match(/img-src[^;]+/)?.[0] || 'Not found';
    console.log(`   img-src: ${imgSrc}`);
    
    if (imgSrc.includes('localhost:3001')) {
      console.log('   ✅ CSP allows localhost:3001 images');
    } else {
      console.log('   ❌ CSP blocks localhost:3001 images');
    }
  } catch (err) {
    console.error('❌ CSP check failed:', err.message);
  }
  
  // 5. Frontend environment check
  console.log('5. 🔧 FRONTEND ENVIRONMENT:');
  console.log('   Expected .env.local content:');
  console.log('   VITE_API_URL=http://localhost:3001/api');
  console.log('   VITE_SUPABASE_URL=https://vyoplbhgbczrqbpishee.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  
  console.log('\n🎯 DIAGNOSIS COMPLETE');
  console.log('==================');
  console.log('If all tests pass above, the issue is likely:');
  console.log('1. Browser caching (hard refresh: Ctrl+F5)');
  console.log('2. Frontend not restarted after .env.local changes');
  console.log('3. Frontend component not using updated API data');
}

comprehensiveDebug();
