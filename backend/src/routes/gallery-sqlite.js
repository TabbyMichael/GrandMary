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

// Initialize gallery tables in SQLite
const initializeGalleryTables = async (db) => {
  try {
    // Create gallery_posts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploader_name TEXT NOT NULL,
        uploader_relationship TEXT,
        uploader_ip TEXT,
        title TEXT,
        caption TEXT,
        file_name TEXT NOT NULL,
        original_file_name TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        tags TEXT, -- JSON array of tags
        is_public BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_date DATE,
        location TEXT
      )
    `);

    // Create gallery_reactions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        reaction_type TEXT NOT NULL,
        reactor_name TEXT NOT NULL,
        reactor_email TEXT,
        reactor_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE,
        UNIQUE(post_id, reactor_name, reactor_ip)
      )
    `);

    // Create gallery_comments table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        commenter_name TEXT NOT NULL,
        commenter_email TEXT,
        commenter_ip TEXT,
        comment_text TEXT NOT NULL,
        is_approved BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
      )
    `);

    // Create gallery_views table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        viewer_ip TEXT,
        viewer_agent TEXT,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
      )
    `);

    // Create gallery_reports table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        reporter_name TEXT NOT NULL,
        reporter_email TEXT,
        reporter_ip TEXT,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_gallery_posts_status ON gallery_posts(status);
      CREATE INDEX IF NOT EXISTS idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_gallery_posts_file_type ON gallery_posts(file_type);
      CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_public ON gallery_posts(is_public);
      CREATE INDEX IF NOT EXISTS idx_gallery_reactions_post_id ON gallery_reactions(post_id);
      CREATE INDEX IF NOT EXISTS idx_gallery_comments_post_id ON gallery_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_gallery_comments_is_approved ON gallery_comments(is_approved);
      CREATE INDEX IF NOT EXISTS idx_gallery_views_post_id ON gallery_views(post_id);
      CREATE INDEX IF NOT EXISTS idx_gallery_reports_post_id ON gallery_reports(post_id);
    `);

    // Create trigger for updated_at
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_gallery_posts_updated_at 
      AFTER UPDATE ON gallery_posts
      FOR EACH ROW
      BEGIN
        UPDATE gallery_posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_gallery_comments_updated_at 
      AFTER UPDATE ON gallery_comments
      FOR EACH ROW
      BEGIN
        UPDATE gallery_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    console.log('Gallery tables initialized successfully');
  } catch (error) {
    console.error('Error creating gallery tables:', error);
  }
};

// POST /api/gallery/upload - Upload gallery files
router.post('/upload', uploadLimiter, upload.array('files', 10), [
  body('uploaderName').trim().isLength({ min: 1, max: 255 }).withMessage('Uploader name is required'),
  body('relationship').optional().trim().isLength({ max: 255 }).withMessage('Relationship too long'),
  body('title').optional().trim().isLength({ max: 500 }).withMessage('Title too long'),
  body('caption').optional().trim().isLength({ max: 2000 }).withMessage('Caption too long'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag too long'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('eventDate').optional().isISO8601().withMessage('Invalid date format'),
  body('location').optional().trim().isLength({ max: 255 }).withMessage('Location too long')
], getDB, async (req, res) => {
  try {
    // Initialize tables if they don't exist
    await initializeGalleryTables(req.db);

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
      relationship,
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
            uploader_name, uploader_relationship, uploader_ip, title, caption,
            file_name, original_file_name, file_type, mime_type, file_size,
            file_path, thumbnail_path, tags, is_public, event_date, location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          uploaderName,
          relationship || null,
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
    // Initialize tables if they don't exist
    await initializeGalleryTables(req.db);

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
    let queryParams = ['approved', 1];

    if (type) {
      whereClause += ' AND gp.file_type = ?';
      queryParams.push(type);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereClause += ` AND gp.tags LIKE ?`;
      queryParams.push(`%${tagArray[0]}%`); // Simple search for now
    }

    if (search) {
      whereClause += ' AND (gp.title LIKE ? OR gp.caption LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Validate sort column
    const allowedSortColumns = ['created_at', 'event_date', 'title'];
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
        LEFT JOIN gallery_comments gc ON gp.id = gc.post_id AND gc.is_approved = 1
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
    await initializeGalleryTables(req.db);

    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const db = req.db;

    // Get post details
    const post = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM gallery_posts WHERE id = ? AND status = ? AND is_public = ?',
        [postId, 'approved', 1],
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
        [postId, 1],
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
    await initializeGalleryTables(req.db);

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
        [postId, 'approved', 1],
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
        INSERT OR REPLACE INTO gallery_reactions (post_id, reaction_type, reactor_name, reactor_email, reactor_ip)
        VALUES (?, ?, ?, ?, ?)
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
    await initializeGalleryTables(req.db);

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
        [postId, 'approved', 1],
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
    await initializeGalleryTables(req.db);

    const db = req.db;

    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_posts,
          COUNT(CASE WHEN file_type = 'image' THEN 1 END) as total_images,
          COUNT(CASE WHEN file_type = 'video' THEN 1 END) as total_videos,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_posts,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_posts,
          COUNT(DISTINCT uploader_ip) as unique_uploaders,
          SUM(file_size) as total_storage_used,
          AVG(file_size) as average_file_size
        FROM gallery_posts
      `, (err, row) => {
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
    await initializeGalleryTables(req.db);

    const db = req.db;

    const tags = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT tags, COUNT(*) as count
        FROM gallery_posts 
        WHERE status = ? AND is_public = ? AND tags IS NOT NULL AND tags != '[]'
        GROUP BY tags
        ORDER BY count DESC
      `, ['approved', 1], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Parse tags and flatten them
    const allTags = [];
    tags.forEach(row => {
      try {
        const tagArray = JSON.parse(row.tags);
        tagArray.forEach(tag => {
          const existing = allTags.find(t => t.tag === tag);
          if (existing) {
            existing.count += 1;
          } else {
            allTags.push({ tag, count: 1 });
          }
        });
      } catch (e) {
        // Skip invalid JSON
      }
    });

    res.json(allTags.sort((a, b) => b.count - a.count));

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
