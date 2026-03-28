import express from 'express';
import { getDatabase } from '../database/init.js';
import { validateCandleLighting } from '../middleware/validation.js';
import { getClientInfo, generateSessionId } from '../utils/helpers.js';

const router = express.Router();

// POST /api/candles - Light a new candle
router.post('/', validateCandleLighting, async (req, res) => {
  try {
    const clientInfo = getClientInfo(req);
    const sessionId = generateSessionId(req);

    const db = await getDatabase();

    // Check if this session/IP has already lit a candle recently (optional rate limiting)
    const recentCandle = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM candles 
         WHERE (ip_address = ? OR session_id = ?) 
         AND created_at > datetime('now', '-1 hour')`,
        [clientInfo.ip, sessionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (recentCandle) {
      return res.status(429).json({
        error: 'Candle already lit recently',
        message: 'You can light another candle in one hour',
      });
    }

    // Insert new candle
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO candles (ip_address, user_agent, session_id) VALUES (?, ?, ?)',
        [clientInfo.ip, clientInfo.userAgent, sessionId],
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
        ['candle_lit', JSON.stringify({ candleId: result.id }), clientInfo.ip, clientInfo.userAgent],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      message: 'Candle lit successfully',
      candleId: result.id,
      litAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error lighting candle:', error);
    res.status(500).json({ error: 'Failed to light candle' });
  }
});

// GET /api/candles/count - Get total candle count
router.get('/count', async (req, res) => {
  try {
    const db = await getDatabase();

    const count = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM candles',
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    res.json({
      totalCandles: count,
      message: `${count} candles have been lit in memory of Mary Wangui`
    });
  } catch (error) {
    console.error('Error fetching candle count:', error);
    res.status(500).json({ error: 'Failed to fetch candle count' });
  }
});

// GET /api/candles/recent - Get recent candle activity
router.get('/recent', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const db = await getDatabase();

    const recentCandles = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id,
          created_at,
          DATE(created_at) as date,
          TIME(created_at) as time
        FROM candles 
        ORDER BY created_at DESC 
        LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      candles: recentCandles,
      total: recentCandles.length,
    });
  } catch (error) {
    console.error('Error fetching recent candles:', error);
    res.status(500).json({ error: 'Failed to fetch recent candles' });
  }
});

// GET /api/candles/stats - Get candle statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase();

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT ip_address) as unique_ips,
          DATE(created_at) as latest_date,
          TIME(created_at) as latest_time
        FROM candles
        ORDER BY created_at DESC
        LIMIT 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Get candles by day for the last 30 days
    const dailyStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM candles 
        WHERE created_at >= date('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      totalCandles: stats.total,
      uniqueVisitors: stats.unique_ips,
      latestCandleDate: stats.latest_date,
      latestCandleTime: stats.latest_time,
      dailyActivity: dailyStats,
    });
  } catch (error) {
    console.error('Error fetching candle stats:', error);
    res.status(500).json({ error: 'Failed to fetch candle statistics' });
  }
});

export default router;
