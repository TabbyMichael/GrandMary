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

async function checkTributes() {
  try {
    console.log('🔍 Checking Supabase tributes...');
    
    // Get all tributes
    const { data: tributes, error } = await supabase
      .from('tributes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching tributes:', error);
      return;
    }
    
    console.log(`\n📊 Found ${tributes.length} tributes in Supabase:`);
    tributes.forEach((tribute, index) => {
      console.log(`\n${index + 1}. ID: ${tribute.id}`);
      console.log(`   Name: ${tribute.author_name || tribute.name || 'N/A'}`);
      console.log(`   Relationship: ${tribute.author_relationship || tribute.relationship || 'N/A'}`);
      console.log(`   Approved: ${tribute.approved}`);
      console.log(`   Is Public: ${tribute.is_public}`);
      console.log(`   Created: ${tribute.created_at}`);
    });
    
    // Check approved tributes
    const { data: approvedTributes, error: approvedError } = await supabase
      .from('tributes')
      .select('*')
      .eq('approved', true);
    
    if (approvedError) {
      console.error('❌ Error fetching approved tributes:', approvedError);
      return;
    }
    
    console.log(`\n✅ Found ${approvedTributes.length} approved tributes`);
    
    // If no approved tributes, let's approve some
    if (approvedTributes.length === 0 && tributes.length > 0) {
      console.log('\n🔧 Approving all tributes...');
      
      const { error: updateError } = await supabase
        .from('tributes')
        .update({ approved: true })
        .neq('id', null); // Update all records
      
      if (updateError) {
        console.error('❌ Error approving tributes:', updateError);
      } else {
        console.log('✅ All tributes approved successfully!');
      }
    }
    
    // Test the API response format
    console.log('\n🧪 Testing API response format...');
    const { data: apiTest, error: apiError } = await supabase
      .from('tributes')
      .select('id, author_name, author_relationship, message, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (apiError) {
      console.error('❌ API test error:', apiError);
    } else {
      console.log('✅ API format test successful:');
      console.log('Sample record:', apiTest[0]);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTributes();
