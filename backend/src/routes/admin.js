import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { getClientInfo } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// GET /api/admin/dashboard - Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDatabase();

    // Get various statistics
    const [
      tributeStats,
      galleryStats,
      candleStats,
      recentActivity,
      analyticsOverview
    ] = await Promise.all([
      // Tribute statistics
      new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN approved = TRUE THEN 1 END) as approved,
            COUNT(CASE WHEN approved = FALSE THEN 1 END) as pending,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as this_week
          FROM tributes`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      }),
      // Gallery statistics
      new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as this_week
          FROM gallery_posts`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      }),
      // Candle statistics
      new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as this_week
          FROM candles`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      }),
      // Recent activity
      new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            'tribute' as type,
            id,
            name as title,
            approved,
            created_at
          FROM tributes
          WHERE created_at >= date('now', '-7 days')
          UNION ALL
          SELECT 
            'gallery' as type,
            id,
            COALESCE(title, 'Gallery Post') as title,
            CASE WHEN status = 'approved' THEN 1 ELSE 0 END as approved,
            created_at
          FROM gallery_posts
          WHERE created_at >= date('now', '-7 days')
          UNION ALL
          SELECT 
            'candle' as type,
            id,
            'Candle lit' as title,
            TRUE as approved,
            created_at
          FROM candles
          WHERE created_at >= date('now', '-7 days')
          ORDER BY created_at DESC
          LIMIT 10`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      }),
      // Analytics overview
      new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total_events,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(CASE WHEN created_at >= date('now', '-24 hours') THEN 1 END) as today,
            COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as this_week
          FROM analytics`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      }),
    ]);

    res.json({
      tributes: tributeStats,
      gallery: galleryStats,
      candles: candleStats,
      analytics: analyticsOverview,
      recentActivity,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/tributes - Manage tributes (admin view)
router.get('/tributes', validatePagination, async (req, res) => {
  try {
    const { page, limit, status } = req.pagination;
    const offset = (page - 1) * limit;

    const db = await getDatabase();

    // Build query based on status
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status === 'approved') {
      whereClause += ' AND approved = TRUE';
    } else if (status === 'pending') {
      whereClause += ' AND approved = FALSE';
    }

    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM tributes ${whereClause}`,
        params,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // Get tributes with full details
    const tributes = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, 
          name, 
          relationship, 
          message, 
          email,
          approved,
          ip_address,
          created_at,
          updated_at
        FROM tributes 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      tributes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin tributes:', error);
    res.status(500).json({ error: 'Failed to fetch tributes' });
  }
});

// PUT /api/admin/tributes/:id/approve - Approve a tribute
router.put('/tributes/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Check if tribute exists
    const tribute = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name FROM tributes WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!tribute) {
      return res.status(404).json({ error: 'Tribute not found' });
    }

    // Update tribute approval status
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE tributes SET approved = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
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
        ['tribute_approved', JSON.stringify({ tributeId: id, adminId: req.user.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Tribute approved successfully',
      tributeId: id,
      tributeName: tribute.name,
    });
  } catch (error) {
    console.error('Error approving tribute:', error);
    res.status(500).json({ error: 'Failed to approve tribute' });
  }
});

// DELETE /api/admin/tributes/:id - Delete a tribute
router.delete('/tributes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Check if tribute exists
    const tribute = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name FROM tributes WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!tribute) {
      return res.status(404).json({ error: 'Tribute not found' });
    }

    // Delete tribute
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM tributes WHERE id = ?',
        [id],
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
        ['tribute_deleted', JSON.stringify({ tributeId: id, tributeName: tribute.name, adminId: req.user.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Tribute deleted successfully',
      tributeId: id,
      tributeName: tribute.name,
    });
  } catch (error) {
    console.error('Error deleting tribute:', error);
    res.status(500).json({ error: 'Failed to delete tribute' });
  }
});

// GET /api/admin/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const db = await getDatabase();

    // Get analytics data for specified period
    const analytics = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          event_type,
          DATE(created_at) as date,
          COUNT(*) as count,
          COUNT(DISTINCT ip_address) as unique_visitors
        FROM analytics 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY event_type, DATE(created_at)
        ORDER BY date DESC, event_type`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get event type summary
    const summary = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          event_type,
          COUNT(*) as total_count,
          COUNT(DISTINCT ip_address) as unique_visitors,
          MAX(created_at) as last_occurrence
        FROM analytics 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY event_type
        ORDER BY total_count DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      period: `${days} days`,
      dailyAnalytics: analytics,
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/gallery - Manage gallery posts (admin view)
router.get('/gallery', validatePagination, async (req, res) => {
  try {
    const { page, limit, status } = req.pagination;
    const offset = (page - 1) * limit;

    const db = await getDatabase();

    // Build query based on status
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status === 'approved') {
      whereClause += ' AND status = "approved"';
    } else if (status === 'pending') {
      whereClause += ' AND status = "pending"';
    } else if (status === 'rejected') {
      whereClause += ' AND status = "rejected"';
    }

    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM gallery_posts ${whereClause}`,
        params,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // Get gallery posts
    const posts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM gallery_posts 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin gallery posts:', error);
    res.status(500).json({ error: 'Failed to fetch gallery posts' });
  }
});

// PUT /api/admin/gallery/:id/approve - Approve a gallery post
router.put('/gallery/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Check if post exists
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, title FROM gallery_posts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!post) {
      return res.status(404).json({ error: 'Gallery post not found' });
    }

    // Update post status
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE gallery_posts SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
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
        ['gallery_post_approved', JSON.stringify({ postId: id, adminId: req.user.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Gallery post approved successfully',
      postId: id,
    });
  } catch (error) {
    console.error('Error approving gallery post:', error);
    res.status(500).json({ error: 'Failed to approve gallery post' });
  }
});

// DELETE /api/admin/gallery/:id - Delete a gallery post
router.delete('/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    // Check if post exists
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, file_path FROM gallery_posts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!post) {
      return res.status(404).json({ error: 'Gallery post not found' });
    }

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM gallery_posts WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Note: We could also delete the physical file here if needed

    // Log analytics event
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO analytics (event_type, event_data, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        ['gallery_post_deleted', JSON.stringify({ postId: id, adminId: req.user.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Gallery post deleted successfully',
      postId: id,
    });
  } catch (error) {
    console.error('Error deleting gallery post:', error);
    res.status(500).json({ error: 'Failed to delete gallery post' });
  }
});

export default router;
