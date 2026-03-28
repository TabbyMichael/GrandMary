import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init.js';
import { validateAdminRegistration, validateAdminLogin } from '../middleware/validation.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { getClientInfo } from '../utils/helpers.js';

const router = express.Router();

// POST /api/auth/register - Register a new admin user
router.post('/register', validateAdminRegistration, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Check if username already exists
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
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new admin user
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, passwordHash, email || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });

    // Log analytics event
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO analytics (event_type, event_data, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        ['admin_registered', JSON.stringify({ userId: result.id, username }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      userId: result.id,
      username,
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ error: 'Failed to register admin user' });
  }
});

// POST /api/auth/login - Admin login
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Find user by username
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, password_hash, email FROM admin_users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log analytics event
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO analytics (event_type, event_data, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        ['admin_login', JSON.stringify({ userId: user.id, username }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user info (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const clientInfo = getClientInfo(req);
    const db = await getDatabase();

    // Log analytics event
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO analytics (event_type, event_data, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        ['admin_logout', JSON.stringify({ userId: req.user.id, username: req.user.username }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
