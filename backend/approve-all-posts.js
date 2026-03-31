import { supabaseAdmin } from './src/supabase-config.js';
import { getDatabase } from './src/database/init.js';

async function approveAll() {
  console.log('🚀 Approving all gallery posts...');

  // 1. Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .update({ status: 'approved' })
      .neq('status', 'approved');

    if (error) {
      console.error('❌ Supabase update error:', error.message);
    } else {
      console.log('✅ Supabase posts approved.');
    }
  } catch (err) {
    console.warn('⚠️ Supabase not available.');
  }

  // 2. SQLite
  try {
    const db = await getDatabase();
    await new Promise((resolve, reject) => {
      db.run("UPDATE gallery_posts SET status = 'approved' WHERE status != 'approved'", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ SQLite posts approved.');
  } catch (err) {
    console.warn('⚠️ SQLite error:', err.message);
  }

  console.log('✨ All done!');
  process.exit(0);
}

approveAll();
