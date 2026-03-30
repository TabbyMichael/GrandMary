import dotenv from 'dotenv';
import databaseService from './src/services/databaseService.js';

dotenv.config();

async function testFixedStats() {
  console.log('🔍 Testing fixed stats method...');
  
  try {
    const stats = await databaseService.executeWithFallback('getStats', { traceId: 'test-trace' });
    console.log('✅ Stats retrieved successfully:', stats);
  } catch (error) {
    console.error('❌ Stats failed:', error.message);
  }
}

testFixedStats();
