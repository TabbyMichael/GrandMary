async function testCorsFix() {
  console.log('🔍 Testing CORS fix for images...');
  
  try {
    // Test the image URL that was failing
    const imageUrl = 'http://localhost:3001/uploads/gallery/32d7b1a6-667c-4eb3-a8e0-b59c059a0d97-1774861420915.jpeg';
    
    console.log(`📸 Testing: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📋 Headers:`);
    
    // Check for CORS headers
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    console.log(`   CORS Origin: ${corsOrigin}`);
    console.log(`   CORS Methods: ${corsMethods}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
    
    if (corsOrigin === '*') {
      console.log('✅ CORS headers are properly set for images!');
    } else {
      console.log('❌ CORS headers missing - backend needs restart');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCorsFix();
