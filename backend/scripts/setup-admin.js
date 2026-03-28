import bcrypt from 'bcryptjs';
import { getDatabase } from '../src/database/init.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    const db = await getDatabase();
    
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@everbloom.com';

    // Check if admin user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM admin_users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      console.log(`✅ Admin user '${username}' already exists`);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, passwordHash, email],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${result.id}`);
    console.log(`\n⚠️  Please change the default password in production!`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser().then(() => {
  process.exit(0);
});
