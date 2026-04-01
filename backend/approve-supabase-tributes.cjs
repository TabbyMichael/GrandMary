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

async function approveSupabaseTributes() {
  try {
    console.log('🌹 Approving Supabase tributes...');
    
    // Update all tributes to have status = 'approved'
    const { data, error } = await supabase
      .from('tributes')
      .update({ status: 'approved' })
      .neq('id', null); // Update all records
    
    if (error) {
      console.error('❌ Error approving tributes:', error);
      return;
    }
    
    console.log(`✅ Successfully updated ${data.length} tributes to approved status`);
    
    // Verify the update
    const { data: approvedTributes, error: verifyError } = await supabase
      .from('tributes')
      .select('author_name, author_relationship, status')
      .eq('status', 'approved');
    
    if (verifyError) {
      console.error('❌ Error verifying tributes:', verifyError);
      return;
    }
    
    console.log(`\n✅ Verification: ${approvedTributes.length} approved tributes now in Supabase`);
    console.log('\n🌹 Approved tributes:');
    approvedTributes.forEach((tribute, index) => {
      console.log(`${index + 1}. ${tribute.author_name} (${tribute.author_relationship})`);
    });
    
    console.log('\n🎉 Supabase tributes are now approved and ready!');
    console.log('📱 The API should now return these tributes to the frontend.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

approveSupabaseTributes();
