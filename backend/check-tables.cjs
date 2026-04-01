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

async function checkTables() {
  try {
    console.log('🔍 Checking available tables...');
    
    // Try to access information schema to see what tables exist
    const { data, error } = await supabase
      .rpc('get_table_info'); // This might not work, let's try different approach
    
    if (error) {
      console.log('ℹ️  RPC method not available, trying direct table checks...');
      
      // Check common table names
      const possibleTables = [
        'tributes',
        'gallery_posts',
        'users',
        'candles',
        'tribute_reactions',
        'comments',
        'reactions',
        'reports'
      ];
      
      for (const tableName of possibleTables) {
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.log(`❌ ${tableName}: ${countError.message}`);
          } else {
            console.log(`✅ ${tableName}: ${count || 0} records`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Tables found:', data);
    }
    
    // Let's also check if there's a tributes table with different structure
    console.log('\n🔍 Checking for tributes table with different structure...');
    
    // Try to insert a test record to see the actual structure
    try {
      const testRecord = {
        name: 'Test User',
        relationship: 'Friend',
        message: 'Test message for structure check'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('tributes')
        .insert(testRecord)
        .select();
      
      if (insertError) {
        console.log('❌ tributes table insert error:', insertError.message);
        
        // Try with different field names
        const altTestRecord = {
          author_name: 'Test User',
          author_relationship: 'Friend',
          message: 'Test message for structure check',
          is_public: true
        };
        
        const { data: altData, error: altError } = await supabase
          .from('tributes')
          .insert(altTestRecord)
          .select();
        
        if (altError) {
          console.log('❌ Alternative tributes insert error:', altError.message);
        } else {
          console.log('✅ Alternative tributes structure works!');
          console.log('📋 Columns:', Object.keys(altData[0]));
          
          // Clean up
          await supabase.from('tributes').delete().eq('author_name', 'Test User');
        }
      } else {
        console.log('✅ Basic tributes structure works!');
        console.log('📋 Columns:', Object.keys(insertData[0]));
        
        // Clean up
        await supabase.from('tributes').delete().eq('name', 'Test User');
      }
    } catch (err) {
      console.log('❌ Test insert failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTables();
