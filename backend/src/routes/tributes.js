import express from 'express';
import { getDatabase } from '../database/init.js';
import { validateTributeSubmission, validatePagination } from '../middleware/validation.js';
import { getClientInfo } from '../utils/helpers.js';

const router = express.Router();

// GET /api/tributes - Fetch approved tributes with pagination
router.get('/', validatePagination, async (req, res) => {
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

    // Get tributes
    const tributes = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, 
          name, 
          relationship, 
          message, 
          DATE(created_at) as date,
          created_at
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
    console.error('Error fetching tributes:', error);
    res.status(500).json({ error: 'Failed to fetch tributes' });
  }
});

// POST /api/tributes - Submit a new tribute
router.post('/', validateTributeSubmission, async (req, res) => {
  try {
    const { name, relationship, message, email } = req.body;
    const clientInfo = getClientInfo(req);

    const db = await getDatabase();

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tributes (name, relationship, message, email, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, relationship, message, email || null, clientInfo.ip, clientInfo.userAgent],
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
        ['tribute_submitted', JSON.stringify({ tributeId: result.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      message: 'Tribute submitted successfully. It will be visible once approved.',
      tributeId: result.id,
      status: 'pending_approval'
    });
  } catch (error) {
    console.error('Error submitting tribute:', error);
    res.status(500).json({ error: 'Failed to submit tribute' });
  }
});

// GET /api/tributes/stats - Get tribute statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase();

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN approved = TRUE THEN 1 END) as approved,
          COUNT(CASE WHEN approved = FALSE THEN 1 END) as pending,
          DATE(created_at) as latest_date
        FROM tributes
        ORDER BY created_at DESC
        LIMIT 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      totalTributes: stats.total,
      approvedTributes: stats.approved,
      pendingTributes: stats.pending,
      latestSubmissionDate: stats.latest_date,
    });
  } catch (error) {
    console.error('Error fetching tribute stats:', error);
    res.status(500).json({ error: 'Failed to fetch tribute statistics' });
  }
});

export default router;
