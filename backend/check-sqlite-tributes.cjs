const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const DB_PATH = path.join(__dirname, 'database', 'everbloom.db');

async function checkTributes() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking SQLite tributes...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Check table structure
    db.all('PRAGMA table_info(tributes)', (err, rows) => {
      if (err) {
        console.error('❌ Error getting table info:', err);
        db.close();
        reject(err);
        return;
      }
      
      console.log('\n📋 Tributes table structure:');
      rows.forEach(row => {
        console.log(`  ${row.name}: ${row.type} (nullable: ${row.notnull === 0 ? 'yes' : 'no'})`);
      });

      // Check all tributes
      db.all('SELECT * FROM tributes', (err, rows) => {
        if (err) {
          console.error('❌ Error getting tributes:', err);
          db.close();
          reject(err);
          return;
        }
        
        console.log(`\n📊 Found ${rows.length} tributes:`);
        rows.forEach((row, index) => {
          console.log(`\n${index + 1}. ID: ${row.id}`);
          console.log(`   Name: ${row.author_name || row.name || 'N/A'}`);
          console.log(`   Relationship: ${row.author_relationship || row.relationship || 'N/A'}`);
          console.log(`   Status: ${row.status || 'N/A'}`);
          console.log(`   Is Public: ${row.is_public || row.approved || 'N/A'}`);
          console.log(`   Created: ${row.created_at}`);
        });

        // Check specifically for approved tributes
        db.all('SELECT * FROM tributes WHERE status = "approved"', (err, approvedRows) => {
          if (err) {
            console.error('❌ Error getting approved tributes:', err);
            db.close();
            reject(err);
            return;
          }
          
          console.log(`\n✅ Found ${approvedRows.length} approved tributes`);
          
          // If no approved tributes, let's update some to be approved
          if (approvedRows.length === 0 && rows.length > 0) {
            console.log('\n🔧 Updating tributes to approved status...');
            
            db.run('UPDATE tributes SET status = "approved" WHERE status IS NULL OR status != "approved"', function(err) {
              if (err) {
                console.error('❌ Error updating tributes:', err);
              } else {
                console.log(`✅ Updated ${this.changes} tributes to approved status`);
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
          } else {
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
                reject(err);
              } else {
                console.log('✅ Database connection closed');
                resolve();
              }
            });
          }
        });
      });
    });
  });
}

checkTributes().catch(console.error);
