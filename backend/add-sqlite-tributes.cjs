const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const DB_PATH = path.join(__dirname, 'database', 'everbloom.db');

// Sample tributes data
const sampleTributes = [
  {
    author_name: "Sarah Johnson",
    author_relationship: "Granddaughter",
    author_email: "sarah.j@email.com",
    author_ip: "127.0.0.1",
    message: "Grandma, your garden was always my favorite place. The way you tended to each flower with such love and care taught me the meaning of patience and dedication. I miss our morning walks and the stories you shared. Your legacy lives on through every bloom.",
    is_public: 1,
    status: "approved"
  },
  {
    author_name: "Michael Chen",
    author_relationship: "Grandson",
    author_email: "m.chen@email.com",
    author_ip: "127.0.0.1",
    message: "I'll always remember Grandma's Sunday dinners. She made the best apple pie in the world, and her kitchen was always filled with laughter and love. Thank you for teaching me the importance of family and for all the memories we shared.",
    is_public: 1,
    status: "approved"
  },
  {
    author_name: "Emily Rodriguez",
    author_relationship: "Friend",
    author_email: "emily.r@email.com",
    author_ip: "127.0.0.1",
    message: "Your friendship was a gift that I'll treasure forever. You had a way of making everyone feel special and loved. I remember our tea parties and the way you always knew exactly what to say to brighten my day. Rest in peace, dear friend.",
    is_public: 1,
    status: "approved"
  },
  {
    author_name: "David Thompson",
    author_relationship: "Neighbor",
    author_email: "d.thompson@email.com",
    author_ip: "127.0.0.1",
    message: "For over 30 years, you were the best neighbor anyone could ask for. Your kindness knew no bounds, from sharing vegetables from your garden to watching our pets when we were away. The neighborhood feels empty without your warm smile.",
    is_public: 1,
    status: "approved"
  },
  {
    author_name: "Lisa Wang",
    author_relationship: "Granddaughter",
    author_email: "lisa.w@email.com",
    author_ip: "127.0.0.1",
    message: "Grandma, you taught me how to bake, and every time I make your famous chocolate chip cookies, I feel like you're right there with me. Thank you for all the love, wisdom, and delicious memories. You're forever in my heart.",
    is_public: 1,
    status: "approved"
  },
  {
    author_name: "Robert Martinez",
    author_relationship: "Friend",
    author_email: "r.martinez@email.com",
    author_ip: "127.0.0.1",
    message: "Your strength and grace inspired everyone who knew you. Even during difficult times, you maintained your positive outlook and continued to spread joy. Thank you for being such a wonderful friend and mentor to our community.",
    is_public: 1,
    status: "approved"
  }
];

async function addSampleTributes() {
  return new Promise((resolve, reject) => {
    console.log('🌹 Adding sample tributes to SQLite database...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Check current tributes count
    db.get('SELECT COUNT(*) as count FROM tributes', (err, row) => {
      if (err) {
        console.error('❌ Error checking tributes count:', err);
        db.close();
        reject(err);
        return;
      }
      
      console.log(`📊 Current tributes count: ${row.count}`);
      
      if (row.count > 0) {
        console.log('ℹ️  Tributes already exist, skipping insertion');
        db.close();
        resolve();
        return;
      }

      // Add sample tributes
      const stmt = db.prepare(`
        INSERT INTO tributes (
          author_name, author_relationship, author_email, author_ip, 
          message, is_public, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      let insertedCount = 0;
      
      sampleTributes.forEach((tribute, index) => {
        stmt.run([
          tribute.author_name,
          tribute.author_relationship,
          tribute.author_email,
          tribute.author_ip,
          tribute.message,
          tribute.is_public,
          tribute.status
        ], function(err) {
          if (err) {
            console.error(`❌ Error inserting tribute ${index + 1}:`, err);
          } else {
            insertedCount++;
            console.log(`✅ Added tribute ${insertedCount}: ${tribute.author_name} (${tribute.author_relationship})`);
            
            if (insertedCount === sampleTributes.length) {
              stmt.finalize();
              
              // Verify the tributes were added
              db.get('SELECT COUNT(*) as count FROM tributes WHERE status = "approved"', (err, row) => {
                if (err) {
                  console.error('❌ Error verifying tributes:', err);
                } else {
                  console.log(`\n✅ Verification: ${row.count} approved tributes now in database`);
                  console.log('\n🎉 Tribute Wall is now ready with sample content!');
                  console.log('📱 Visit your website to see the beautiful tributes displayed.');
                }
                
                db.close((err) => {
                  if (err) {
                    console.error('❌ Error closing database:', err);
                    reject(err);
                  } else {
                    console.log('✅ Database connection closed');
                    resolve();
                  }
                });
              });
            }
          }
        });
      });
    });
  });
}

addSampleTributes().catch(console.error);
