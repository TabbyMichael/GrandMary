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
    
    // Get all tributes first
    const { data: allTributes, error: fetchError } = await supabase
      .from('tributes')
      .select('id, author_name, status');
    
    if (fetchError) {
      console.error('❌ Error fetching tributes:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${allTributes.length} tributes to update`);
    
    // Update each tribute individually
    let updatedCount = 0;
    for (const tribute of allTributes) {
      const { error: updateError } = await supabase
        .from('tributes')
        .update({ status: 'approved' })
        .eq('id', tribute.id);
      
      if (updateError) {
        console.error(`❌ Error updating tribute ${tribute.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Updated: ${tribute.author_name} -> approved`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} tributes to approved status`);
    
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
