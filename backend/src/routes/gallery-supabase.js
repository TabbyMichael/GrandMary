import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { supabase } from '../supabase-config.js';
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

// Database fallback function
const fallbackToSQLite = async (operation, ...args) => {
  console.warn('Supabase operation failed, falling back to SQLite');
  try {
    const db = await getDatabase();
    // Implement SQLite fallback operations here
    // For now, we'll just throw an error to indicate fallback isn't fully implemented
    throw new Error('SQLite fallback not implemented for this operation');
  } catch (error) {
    console.error('SQLite fallback also failed:', error);
    throw error;
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
], async (req, res) => {
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
      relationship,
      title,
      caption,
      tags = [],
      isPublic = true,
      eventDate,
      location
    } = req.body;

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      try {
        // Upload to Supabase Storage (optional - for now, use local storage)
        // For now, we'll store file info in Supabase database and keep files locally
        
        const postData = {
          uploader_name: uploaderName,
          uploader_relationship: relationship || null,
          uploader_ip: req.ip,
          title: title || null,
          caption: caption || null,
          file_name: file.filename,
          original_file_name: file.originalname,
          file_type: fileType,
          mime_type: file.mimetype,
          file_size: file.size,
          file_path: file.path,
          thumbnail_path: null, // TODO: Generate thumbnails for videos
          tags: tags,
          is_public: isPublic,
          status: 'pending', // Requires admin approval
          event_date: eventDate || null,
          location: location || null
        };

        // Insert into Supabase
        const { data, error } = await supabase
          .from('gallery_posts')
          .insert([postData])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          // Try fallback to SQLite
          await fallbackToSQLite('insertPost', postData);
        }

        uploadedFiles.push({
          id: data[0]?.id,
          fileName: file.filename,
          originalName: file.originalname,
          fileType,
          size: file.size,
          mimeType: file.mimetype
        });
      } catch (error) {
        console.error('Upload error for file:', file.filename, error);
        
        // Clean up uploaded file on error
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        
        return res.status(500).json({ error: `Failed to upload ${file.originalname}` });
      }
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
router.get('/posts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
      tags = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = supabase
      .from('gallery_posts')
      .select(`
        *,
        gallery_reactions!inner(count),
        gallery_comments!inner(count)
      `, { count: 'exact' });

    // Filter for approved and public posts
    query = query.eq('status', 'approved').eq('is_public', true);

    // Apply filters
    if (type) {
      query = query.eq('file_type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,caption.ilike.%${search}%`);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.contains('tags', tagArray);
    }

    // Apply sorting and pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order(sortBy, { ascending: sortOrder === 'ASC' })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      // Try fallback to SQLite
      const fallbackData = await fallbackToSQLite('getPosts', req.query);
      return res.json(fallbackData);
    }

    res.json({
      posts: data || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalItems: count || 0,
        itemsPerPage: parseInt(limit),
        hasNextPage: offset + parseInt(limit) < (count || 0),
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/gallery/posts/:id - Get single post with reactions and comments
router.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Get post details
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('*')
      .eq('id', postId)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError || !post) {
      console.error('Supabase post query error:', postError);
      // Try fallback to SQLite
      const fallbackData = await fallbackToSQLite('getPost', postId);
      return res.json(fallbackData);
    }

    // Record view
    await supabase
      .from('gallery_views')
      .insert([{
        post_id: postId,
        viewer_ip: req.ip,
        viewer_agent: req.get('User-Agent')
      }]);

    // Get reactions
    const { data: reactions, error: reactionsError } = await supabase
      .from('gallery_reactions')
      .select('reaction_type, count')
      .eq('post_id', postId);

    // Get approved comments
    const { data: comments, error: commentsError } = await supabase
      .from('gallery_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (reactionsError || commentsError) {
      console.error('Supabase reactions/comments query error:', reactionsError, commentsError);
    }

    res.json({
      post,
      reactions: reactions || [],
      comments: comments || []
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
], async (req, res) => {
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

    // Check if post exists and is approved
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('id')
      .eq('id', postId)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add or update reaction
    const { data, error } = await supabase
      .from('gallery_reactions')
      .upsert([{
        post_id: postId,
        reaction_type: reactionType,
        reactor_name: reactorName,
        reactor_email: reactorEmail || null,
        reactor_ip: req.ip
      }])
      .select();

    if (error) {
      console.error('Supabase reaction error:', error);
      // Try fallback to SQLite
      await fallbackToSQLite('addReaction', postId, { reactionType, reactorName, reactorEmail });
    }

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
], async (req, res) => {
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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('id')
      .eq('id', postId)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add comment
    const { data, error } = await supabase
      .from('gallery_comments')
      .insert([{
        post_id: postId,
        commenter_name: commenterName,
        commenter_email: commenterEmail || null,
        commenter_ip: req.ip,
        comment_text: commentText,
        is_approved: false // Requires admin approval
      }])
      .select();

    if (error) {
      console.error('Supabase comment error:', error);
      // Try fallback to SQLite
      await fallbackToSQLite('addComment', postId, { commenterName, commenterEmail, commentText });
    }

    res.status(201).json({
      message: 'Comment submitted successfully',
      commentId: data[0]?.id,
      status: 'pending_approval'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/gallery/stats - Get gallery statistics
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select(`
        count(*) as total_posts,
        count(CASE WHEN file_type = 'image' THEN 1 END) as total_images,
        count(CASE WHEN file_type = 'video' THEN 1 END) as total_videos,
        count(CASE WHEN status = 'approved' THEN 1 END) as approved_posts,
        count(CASE WHEN status = 'pending' THEN 1 END) as pending_posts,
        count(DISTINCT uploader_ip) as unique_uploaders,
        sum(file_size) as total_storage_used,
        avg(file_size) as average_file_size
      `)
      .single();

    if (error) {
      console.error('Supabase stats error:', error);
      // Try fallback to SQLite
      const fallbackData = await fallbackToSQLite('getStats');
      return res.json(fallbackData);
    }

    res.json(data);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/gallery/tags - Get all available tags
router.get('/tags', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('tags')
      .eq('status', 'approved')
      .eq('is_public', true)
      .not('tags', 'is', null);

    if (error) {
      console.error('Supabase tags error:', error);
      // Try fallback to SQLite
      const fallbackData = await fallbackToSQLite('getTags');
      return res.json(fallbackData);
    }

    // Count tag occurrences
    const tagCounts = {};
    data.forEach(post => {
      try {
        const tags = post.tags || [];
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      } catch (e) {
        // Skip invalid data
      }
    });

    const result = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    res.json(result);

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
