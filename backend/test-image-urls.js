import dotenv from 'dotenv';
dotenv.config();

// Test the exact image URLs from the API response
const posts = [
  {
    title: "Garden Memories",
    file_name: "6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg"
  },
  {
    title: "Mother's Birthday Video", 
    file_name: "6b2876af-aefe-4f6b-9c65-56d5b7473a98-1774861217556.jpeg"
  },
  {
    title: "Family Gathering",
    file_name: "32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg"
  },
  {
    title: "Beautiful Memory",
    file_name: "32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg"
  }
];

async function testImageUrls() {
  console.log('🖼️ TESTING IMAGE URLS FROM API RESPONSE');
  console.log('=======================================');
  
  const baseUrl = 'http://localhost:3001';
  
  for (const post of posts) {
    const imageUrl = `${baseUrl}/uploads/gallery/${post.file_name}`;
    console.log(`\n📸 Testing: "${post.title}"`);
    console.log(`   URL: ${imageUrl}`);
    
    try {
      const response = await fetch(imageUrl);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      
      if (response.status === 200) {
        console.log('   ✅ Image accessible');
      } else {
        console.log('   ❌ Image not accessible');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 FRONTEND URL CONSTRUCTION TEST:');
  console.log('The frontend should construct URLs like this:');
  posts.forEach(post => {
    const frontendUrl = `${baseUrl}/uploads/gallery/${post.file_name}`;
    console.log(`   "${post.title}": ${frontendUrl}`);
  });
}

testImageUrls();
