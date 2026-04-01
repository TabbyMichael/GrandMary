const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTributesSchema() {
  try {
    console.log('🔍 Checking tributes table schema...');
    
    // Try to get table info - this will show us the actual columns
    const { data, error } = await supabase
      .from('tributes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing tributes table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Found tributes table with columns:');
      console.log('📋 Columns:', Object.keys(data[0]));
      
      console.log('\n📄 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️  Tributes table exists but is empty');
      
      // Let's check if we can see the structure by trying to insert a test record
      const testRecord = {
        name: 'Test User',
        relationship: 'Friend',
        message: 'Test message',
        email: 'test@example.com',
        status: 'approved'
      };
      
      console.log('🧪 Testing table structure with sample record...');
      const { data: insertData, error: insertError } = await supabase
        .from('tributes')
        .insert(testRecord)
        .select();
      
      if (insertError) {
        console.error('❌ Error testing insert:', insertError);
        
        // Let's try without the status field
        console.log('🧪 Trying without status field...');
        const { data: insertData2, error: insertError2 } = await supabase
          .from('tributes')
          .insert({
            name: 'Test User',
            relationship: 'Friend',
            message: 'Test message',
            email: 'test@example.com'
          })
          .select();
        
        if (insertError2) {
          console.error('❌ Error with basic insert:', insertError2);
        } else {
          console.log('✅ Basic insert successful');
          console.log('📋 Columns used:', Object.keys(insertData2[0]));
          
          // Clean up test record
          await supabase.from('tributes').delete().eq('email', 'test@example.com');
        }
      } else {
        console.log('✅ Insert successful');
        console.log('📋 Columns used:', Object.keys(insertData[0]));
        
        // Clean up test record
        await supabase.from('tributes').delete().eq('email', 'test@example.com');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTributesSchema();
