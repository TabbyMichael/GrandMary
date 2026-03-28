import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Create a test image file (just a simple text file for testing)
const testImagePath = path.join(process.cwd(), 'test-image.jpg');
fs.writeFileSync(testImagePath, 'fake image content for testing');

// Create form data
const form = new FormData();
form.append('files', fs.createReadStream(testImagePath), 'test-image.jpg');
form.append('uploaderName', 'Test User');
form.append('title', 'Test Upload');
form.append('caption', 'This is a test upload to verify the gallery works');
form.append('tags', JSON.stringify(['Test', 'Demo']));
form.append('isPublic', 'true');

// Send to API
try {
  const response = await fetch('http://localhost:3001/api/gallery/upload', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  const result = await response.json();
  console.log('Upload response:', result);
} catch (error) {
  console.error('Upload error:', error);
} finally {
  // Clean up test file
  fs.unlinkSync(testImagePath);
}
