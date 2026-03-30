// Test if frontend environment variables are working
console.log('🔍 FRONTEND ENVIRONMENT TEST');
console.log('============================');

// Simulate Vite environment variables
const viteApiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
const viteSupabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://vyoplbhgbczrqbpishee.supabase.co';
const viteSupabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'not-found';

console.log('📋 Environment Variables:');
console.log(`   VITE_API_URL: ${viteApiUrl}`);
console.log(`   VITE_SUPABASE_URL: ${viteSupabaseUrl}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${viteSupabaseAnonKey.substring(0, 20)}...`);

// Test URL construction
const baseUrl = viteApiUrl.replace('/api', '') || 'http://localhost:3001';
const testFileName = '32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg';
const imageUrl = `${baseUrl}/uploads/gallery/${testFileName}`;

console.log('\n🔗 URL Construction:');
console.log(`   Base URL: ${baseUrl}`);
console.log(`   Test file: ${testFileName}`);
console.log(`   Full URL: ${imageUrl}`);

// Test API call
console.log('\n🌐 API Test:');
fetch(`${viteApiUrl}/gallery/posts`)
  .then(response => response.json())
  .then(data => {
    console.log(`   Status: ${data.posts?.length || 0} posts found`);
    if (data.posts && data.posts.length > 0) {
      const post = data.posts[0];
      console.log(`   First post: "${post.title}"`);
      console.log(`   File: ${post.file_name}`);
      console.log(`   Expected URL: ${baseUrl}/uploads/gallery/${post.file_name}`);
    }
  })
  .catch(error => {
    console.error('   ❌ API Error:', error.message);
  });

console.log('\n🎯 TEST COMPLETE');
console.log('Open browser console to see results');
