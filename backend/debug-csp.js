import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugCSP() {
  console.log('🔍 Debugging CSP and image loading...');
  
  // Test 1: Check if image is accessible
  console.log('\n1. Testing direct image access:');
  try {
    const response = await fetch('http://localhost:3001/uploads/gallery/32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
  
  // Test 2: Check API response
  console.log('\n2. Testing API response:');
  try {
    const response = await fetch('http://localhost:3001/api/gallery/posts');
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Posts count: ${data.posts?.length || 0}`);
    
    if (data.posts && data.posts.length > 0) {
      const post = data.posts[0];
      console.log(`   First post: "${post.title}"`);
      console.log(`   File name: ${post.file_name}`);
      
      // Check what URL the frontend would construct
      const baseUrl = 'http://localhost:3001';
      const imageUrl = `${baseUrl}/uploads/gallery/${post.file_name}`;
      console.log(`   Expected image URL: ${imageUrl}`);
      
      // Test the constructed URL
      try {
        const imgResponse = await fetch(imageUrl);
        console.log(`   Image URL test: ${imgResponse.status}`);
      } catch (error) {
        console.error(`   Image URL error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`   API Error: ${error.message}`);
  }
  
  // Test 3: Check CSP header
  console.log('\n3. Checking CSP header:');
  try {
    const response = await fetch('http://localhost:3001/api/gallery/posts');
    const csp = response.headers.get('content-security-policy');
    console.log(`   CSP: ${csp}`);
    
    if (csp && csp.includes('http://localhost:3001')) {
      console.log('   ✅ CSP includes localhost:3001');
    } else {
      console.log('   ❌ CSP does not include localhost:3001');
      console.log('   🔧 Backend server needs restart to pick up CSP changes');
    }
  } catch (error) {
    console.error(`   CSP Error: ${error.message}`);
  }
}

debugCSP();
