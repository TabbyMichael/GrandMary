import bcrypt from 'bcryptjs';
import { getDatabase } from '../src/database/init.js';

const resetAdmin = async () => {
  const db = await getDatabase();
  const username = 'admin';
  const newPassword = 'admin123';
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  db.run(
    'UPDATE admin_users SET password_hash = ? WHERE username = ?',
    [passwordHash, username],
    function(err) {
      if (err) {
        console.error('❌ Error resetting password:', err);
      } else if (this.changes === 0) {
        console.log('❌ User not found');
      } else {
        console.log(`✅ Password reset successfully for user "${username}"`);
        console.log(`   New Password: ${newPassword}`);
      }
      process.exit(0);
    }
  );
};

resetAdmin();
