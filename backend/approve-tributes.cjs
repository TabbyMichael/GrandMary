const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const DB_PATH = path.join(__dirname, 'database', 'everbloom.db');

async function approveTributes() {
  return new Promise((resolve, reject) => {
    console.log('🌹 Approving existing tributes...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Update all tributes to be approved
    db.run('UPDATE tributes SET approved = 1 WHERE approved IS NULL OR approved = 0', function(err) {
      if (err) {
        console.error('❌ Error updating tributes:', err);
        db.close();
        reject(err);
        return;
      }
      
      console.log(`✅ Updated ${this.changes} tributes to approved status`);
      
      // Verify the update
      db.get('SELECT COUNT(*) as count FROM tributes WHERE approved = 1', (err, row) => {
        if (err) {
          console.error('❌ Error verifying tributes:', err);
          db.close();
          reject(err);
          return;
        }
        
        console.log(`\n✅ Verification: ${row.count} approved tributes now in database`);
        console.log('\n🎉 Tribute Wall is now ready with approved tributes!');
        console.log('📱 Visit your website to see the beautiful tributes displayed.');
        
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
    });
  });
}

approveTributes().catch(console.error);
