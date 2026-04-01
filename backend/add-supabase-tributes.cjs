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

// Sample tributes data
const sampleTributes = [
  {
    author_name: "Sarah Johnson",
    author_relationship: "Granddaughter",
    author_email: "sarah.j@email.com",
    author_ip: "127.0.0.1",
    message: "Grandma, your garden was always my favorite place. The way you tended to each flower with such love and care taught me the meaning of patience and dedication. I miss our morning walks and the stories you shared. Your legacy lives on through every bloom.",
    is_public: true,
    approved: true
  },
  {
    author_name: "Michael Chen",
    author_relationship: "Grandson",
    author_email: "m.chen@email.com",
    author_ip: "127.0.0.1",
    message: "I'll always remember Grandma's Sunday dinners. She made the best apple pie in the world, and her kitchen was always filled with laughter and love. Thank you for teaching me the importance of family and for all the memories we shared.",
    is_public: true,
    approved: true
  },
  {
    author_name: "Emily Rodriguez",
    author_relationship: "Friend",
    author_email: "emily.r@email.com",
    author_ip: "127.0.0.1",
    message: "Your friendship was a gift that I'll treasure forever. You had a way of making everyone feel special and loved. I remember our tea parties and the way you always knew exactly what to say to brighten my day. Rest in peace, dear friend.",
    is_public: true,
    approved: true
  },
  {
    author_name: "David Thompson",
    author_relationship: "Neighbor",
    author_email: "d.thompson@email.com",
    author_ip: "127.0.0.1",
    message: "For over 30 years, you were the best neighbor anyone could ask for. Your kindness knew no bounds, from sharing vegetables from your garden to watching our pets when we were away. The neighborhood feels empty without your warm smile.",
    is_public: true,
    approved: true
  },
  {
    author_name: "Lisa Wang",
    author_relationship: "Granddaughter",
    author_email: "lisa.w@email.com",
    author_ip: "127.0.0.1",
    message: "Grandma, you taught me how to bake, and every time I make your famous chocolate chip cookies, I feel like you're right there with me. Thank you for all the love, wisdom, and delicious memories. You're forever in my heart.",
    is_public: true,
    approved: true
  },
  {
    author_name: "Robert Martinez",
    author_relationship: "Friend",
    author_email: "r.martinez@email.com",
    author_ip: "127.0.0.1",
    message: "Your strength and grace inspired everyone who knew you. Even during difficult times, you maintained your positive outlook and continued to spread joy. Thank you for being such a wonderful friend and mentor to our community.",
    is_public: true,
    approved: true
  }
];

async function addSampleTributes() {
  try {
    console.log('🌹 Adding sample tributes to Supabase...');
    
    // First, let's check if tributes table exists and get current count
    const { count: existingCount, error: countError } = await supabase
      .from('tributes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error checking existing tributes:', countError);
      console.log('ℹ️  This might mean the tributes table doesn\'t exist yet.');
      console.log('🔧 Let\'s try to create the table first...');
      
      // Try to create the table (you might need to do this manually in Supabase dashboard)
      console.log('⚠️  Please create the tributes table in Supabase dashboard with these columns:');
      console.log(`
CREATE TABLE tributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_relationship TEXT,
  author_email TEXT,
  author_ip INET,
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tributes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to approved tributes
CREATE POLICY "Approved tributes are viewable by everyone" ON tributes
  FOR SELECT USING (approved = true AND is_public = true);

-- Create policy for service role to manage all tributes
CREATE POLICY "Service role can manage all tributes" ON tributes
  FOR ALL USING (auth.role() = 'service_role');
      `);
      return;
    }
    
    console.log(`📊 Current tributes count: ${existingCount || 0}`);
    
    if (existingCount > 0) {
      console.log('ℹ️  Tributes already exist, skipping insertion');
      return;
    }
    
    // Add sample tributes
    const { data, error } = await supabase
      .from('tributes')
      .insert(sampleTributes)
      .select();
    
    if (error) {
      console.error('❌ Error adding sample tributes:', error);
      return;
    }
    
    console.log(`✅ Successfully added ${data.length} sample tributes!`);
    console.log('\n🌹 Sample tributes added:');
    data.forEach((tribute, index) => {
      console.log(`${index + 1}. ${tribute.author_name} (${tribute.author_relationship})`);
    });
    
    // Verify the tributes were added
    const { data: verifyData, error: verifyError } = await supabase
      .from('tributes')
      .select('author_name, author_relationship, approved')
      .eq('approved', true);
    
    if (verifyError) {
      console.error('❌ Error verifying tributes:', verifyError);
      return;
    }
    
    console.log(`\n✅ Verification: ${verifyData.length} approved tributes now in Supabase`);
    console.log('\n🎉 Tribute Wall is now ready with Supabase content!');
    console.log('📱 Visit your website to see the beautiful tributes displayed.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addSampleTributes();
