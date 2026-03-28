import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'gallery');
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'video/mp4': true,
    'video/webm': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, MP4, and WebM files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 uploads per 15 minutes
  message: {
    error: 'Too many upload attempts. Please try again later.'
  }
});

// Middleware to get database connection
const getDB = async (req, res, next) => {
  try {
    req.db = await getDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// POST /api/gallery/upload - Upload gallery files
router.post('/upload', uploadLimiter, upload.array('files', 10), [
  body('uploaderName').trim().isLength({ min: 1, max: 255 }).withMessage('Uploader name is required'),
  body('uploaderEmail').optional().isEmail().withMessage('Invalid email format'),
  body('title').optional().trim().isLength({ max: 500 }).withMessage('Title too long'),
  body('caption').optional().trim().isLength({ max: 2000 }).withMessage('Caption too long'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag too long'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('eventDate').optional().isISO8601().withMessage('Invalid date format'),
  body('location').optional().trim().isLength({ max: 255 }).withMessage('Location too long')
], getDB, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const {
      uploaderName,
      uploaderEmail,
      title,
      caption,
      tags = [],
      isPublic = true,
      eventDate,
      location
    } = req.body;

    const uploadedFiles = [];
    const db = req.db;

    for (const file of req.files) {
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      let thumbnailPath = null;

      // Generate thumbnail for videos (placeholder for now)
      if (fileType === 'video') {
        // TODO: Implement video thumbnail generation
        thumbnailPath = null;
      }

      // Insert into database
      const result = await new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO gallery_posts (
            uploader_name, uploader_email, uploader_ip, title, caption,
            file_name, original_file_name, file_type, mime_type, file_size,
            file_path, thumbnail_path, tags, is_public, event_date, location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          uploaderName,
          uploaderEmail || null,
          req.ip,
          title || null,
          caption || null,
          file.filename,
          file.originalname,
          fileType,
          file.mimetype,
          file.size,
          file.path,
          thumbnailPath,
          JSON.stringify(tags),
          isPublic,
          eventDate || null,
          location || null
        ], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        });
      });

      uploadedFiles.push({
        id: result.id,
        fileName: file.filename,
        originalName: file.originalname,
        fileType,
        size: file.size,
        mimeType: file.mimetype
      });
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      status: 'pending_approval'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/gallery/posts - Get gallery posts with pagination and filtering
router.get('/posts', getDB, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = null, // 'image' or 'video'
      tags = null, // comma-separated tags
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const db = req.db;

    // Build WHERE clause
    let whereClause = 'WHERE gp.status = ? AND gp.is_public = ?';
    let queryParams = ['approved', true];

    if (type) {
      whereClause += ' AND gp.file_type = ?';
      queryParams.push(type);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause += ` AND gp.tags && ?`;
      queryParams.push(JSON.stringify(tagArray));
    }

    if (search) {
      whereClause += ' AND (gp.title ILIKE ? OR gp.caption ILIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Validate sort column
    const allowedSortColumns = ['created_at', 'event_date', 'title', 'reaction_count'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get posts with counts
    const posts = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          gp.*,
          COUNT(DISTINCT gr.id) as reaction_count,
          COUNT(DISTINCT gc.id) as comment_count,
          COUNT(DISTINCT gv.id) as view_count
        FROM gallery_posts gp
        LEFT JOIN gallery_reactions gr ON gp.id = gr.post_id
        LEFT JOIN gallery_comments gc ON gp.id = gc.post_id AND gc.is_approved = true
        LEFT JOIN gallery_views gv ON gp.id = gv.post_id
        ${whereClause}
        GROUP BY gp.id
        ORDER BY gp.${sortColumn} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      db.all(query, [...queryParams, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      const countQuery = `
        SELECT COUNT(DISTINCT gp.id) as total
        FROM gallery_posts gp
        ${whereClause}
      `;

      db.get(countQuery, queryParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    // Parse tags from JSON string
    const formattedPosts = posts.map(post => ({
      ...post,
      tags: JSON.parse(post.tags || '[]')
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: offset + parseInt(limit) < totalCount,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/gallery/posts/:id - Get single post with reactions and comments
router.get('/posts/:id', getDB, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const db = req.db;

    // Get post details
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM gallery_posts WHERE id = ? AND status = ? AND is_public = ?',
        [postId, 'approved', true],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Record view
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO gallery_views (post_id, viewer_ip, viewer_agent) VALUES (?, ?, ?)',
        [postId, req.ip, req.get('User-Agent')],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get reactions
    const reactions = await new Promise((resolve, reject) => {
      db.all(
        'SELECT reaction_type, COUNT(*) as count FROM gallery_reactions WHERE post_id = ? GROUP BY reaction_type',
        [postId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get approved comments
    const comments = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM gallery_comments WHERE post_id = ? AND is_approved = ? ORDER BY created_at ASC',
        [postId, true],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Parse tags
    post.tags = JSON.parse(post.tags || '[]');

    res.json({
      post,
      reactions,
      comments
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/gallery/posts/:id/react - Add reaction to post
router.post('/posts/:id/react', [
  body('reactionType').isIn(['heart', 'like', 'love', 'smile', 'pray']).withMessage('Invalid reaction type'),
  body('reactorName').trim().isLength({ min: 1, max: 255 }).withMessage('Reactor name is required'),
  body('reactorEmail').optional().isEmail().withMessage('Invalid email format')
], getDB, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const postId = parseInt(req.params.id);
    const { reactionType, reactorName, reactorEmail } = req.body;

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const db = req.db;

    // Check if post exists and is approved
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM gallery_posts WHERE id = ? AND status = ? AND is_public = ?',
        [postId, 'approved', true],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add or update reaction
    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO gallery_reactions (post_id, reaction_type, reactor_name, reactor_email, reactor_ip)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(post_id, reactor_name, reactor_ip) DO UPDATE SET
        reaction_type = excluded.reaction_type,
        created_at = CURRENT_TIMESTAMP
      `);

      stmt.run([postId, reactionType, reactorName, reactorEmail || null, req.ip], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Reaction added successfully' });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// POST /api/gallery/posts/:id/comment - Add comment to post
router.post('/posts/:id/comment', [
  body('commenterName').trim().isLength({ min: 1, max: 255 }).withMessage('Commenter name is required'),
  body('commenterEmail').optional().isEmail().withMessage('Invalid email format'),
  body('commentText').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment is required')
], getDB, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const postId = parseInt(req.params.id);
    const { commenterName, commenterEmail, commentText } = req.body;

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const db = req.db;

    // Check if post exists
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM gallery_posts WHERE id = ? AND status = ? AND is_public = ?',
        [postId, 'approved', true],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add comment
    const result = await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO gallery_comments (post_id, commenter_name, commenter_email, commenter_ip, comment_text)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([postId, commenterName, commenterEmail || null, req.ip, commentText], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    res.status(201).json({
      message: 'Comment submitted successfully',
      commentId: result.id,
      status: 'pending_approval'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/gallery/stats - Get gallery statistics
router.get('/stats', getDB, async (req, res) => {
  try {
    const db = req.db;

    const stats = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM gallery_stats', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/gallery/tags - Get all available tags
router.get('/tags', getDB, async (req, res) => {
  try {
    const db = req.db;

    const tags = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
        FROM gallery_posts 
        WHERE status = ? AND is_public = ? AND tags IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC, tag ASC
      `, ['approved', true], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(tags);

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
