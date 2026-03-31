import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import databaseService from '../services/databaseService.js';
import { 
  ValidationError, 
  GalleryPostNotFoundError, 
  GalleryCommentError,
  GalleryReactionError,
  GalleryUploadError,
  RateLimitError,
  InsufficientStorageError
} from '../errors/index.js';
import { asyncHandler, Logger } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer with enhanced error handling
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'gallery');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Check available storage
      try {
        const stats = await fs.statfs(uploadsDir);
        const freeSpace = stats.bavail * stats.bsize;
        const minRequiredSpace = 100 * 1024 * 1024; // 100MB minimum
        
        if (freeSpace < minRequiredSpace) {
          return cb(new InsufficientStorageError('Insufficient storage space'));
        }
      } catch (diskError) {
        Logger.warn('Could not check disk space', { error: diskError.message });
      }
      
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
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
    cb(new GalleryUploadError(
      `Invalid file type: ${file.mimetype}. Only JPG, PNG, GIF, MP4, and WebM files are allowed.`,
      { mimetype: file.mimetype, originalname: file.originalname }
    ));
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

// Enhanced rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 uploads per 15 minutes
  message: {
    error: 'RATE_LIMIT_ERROR',
    message: 'Too many upload attempts. Please try again later.',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new RateLimitError('Too many upload attempts. Please try again later.');
  }
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    throw new ValidationError('Validation failed', validationErrors);
  }
  next();
};

// POST /api/gallery/upload - Upload gallery files with enhanced error handling
router.post('/upload', uploadLimiter, upload.array('files', 10), [
  body('uploaderName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Uploader name is required and must be between 1 and 255 characters'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Relationship must be less than 255 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Title must be less than 500 characters'),
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Caption must be less than 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('eventDate')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters')
], validateRequest, asyncHandler(async (req, res) => {
  const traceId = req.traceId;
  const uploadedFiles = [];

  if (!req.files || req.files.length === 0) {
    throw new ValidationError('No files uploaded');
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

  Logger.info('Starting gallery upload', {
    trace_id: traceId,
    file_count: req.files.length,
    uploader_name: uploaderName
  });

  // Process files with transaction-like behavior
  for (const file of req.files) {
    try {
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
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
        file_path: `gallery/${file.filename}`,
        thumbnail_path: null,
        tags: tags,
        is_public: isPublic,
        status: 'pending',
        event_date: eventDate || null,
        location: location || null
      };

      // Insert into database with fallback
      const result = await databaseService.executeWithFallback('insertPost', { traceId }, postData);

      uploadedFiles.push({
        id: result.id,
        fileName: file.filename,
        originalName: file.originalname,
        fileType,
        size: file.size,
        mimeType: file.mimetype
      });

      Logger.info('File uploaded successfully', {
        trace_id: traceId,
        file_id: result.id,
        file_name: file.filename
      });

    } catch (error) {
      Logger.error('Failed to upload file', {
        trace_id: traceId,
        file_name: file.filename,
        error: error.message
      });
      
      // Clean up uploaded file on error
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        Logger.warn('Failed to cleanup file', {
          trace_id: traceId,
          file_path: file.path,
          error: cleanupError.message
        });
      }
      
      throw new GalleryUploadError(
        `Failed to upload ${file.originalname}: ${error.message}`,
        { filename: file.originalname, originalError: error.message }
      );
    }
  }

  res.status(201).json({
    message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    files: uploadedFiles,
    status: 'pending_approval',
    trace_id: traceId
  });
}));

// GET /api/gallery/posts - Get gallery posts with enhanced error handling
router.get('/posts', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['image', 'video']).withMessage('Type must be image or video'),
  query('sortBy').optional().isIn(['created_at', 'event_date', 'title']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
], validateRequest, asyncHandler(async (req, res) => {
  const traceId = req.traceId;
  const {
    page = 1,
    limit = 20,
    type = null,
    tags = null,
    search = null,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  Logger.info('Fetching gallery posts', {
    trace_id: traceId,
    page,
    limit,
    type,
    tags,
    search,
    sort_by: sortBy,
    sort_order: sortOrder
  });

  try {
    const result = await databaseService.executeWithFallback('getPosts', { traceId }, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      tags,
      search,
      sortBy,
      sortOrder
    });

    Logger.info('Gallery posts retrieved successfully', {
      trace_id: traceId,
      post_count: result.posts.length,
      total_items: result.pagination.totalItems
    });

    res.json(result);

  } catch (error) {
    Logger.error('Failed to fetch gallery posts', {
      trace_id: traceId,
      error: error.message
    });
    
    throw error;
  }
}));

// GET /api/gallery/posts/:id - Get single post with enhanced error handling
router.get('/posts/:id', [
  param('id').isUUID().withMessage('Invalid post ID format')
], validateRequest, asyncHandler(async (req, res) => {
  const traceId = req.traceId;
  const postId = req.params.id;

  Logger.info('Fetching single gallery post', {
    trace_id: traceId,
    post_id: postId
  });

  try {
    const result = await databaseService.executeWithFallback('getPost', { traceId }, postId);

    if (!result || !result.post) {
      throw new GalleryPostNotFoundError();
    }

    Logger.info('Gallery post retrieved successfully', {
      trace_id: traceId,
      post_id: postId
    });

    res.json(result);

  } catch (error) {
    if (error instanceof GalleryPostNotFoundError) {
      throw error;
    }

    Logger.error('Failed to fetch gallery post', {
      trace_id: traceId,
      post_id: postId,
      error: error.message
    });
    
    throw error;
  }
}));

// POST /api/gallery/posts/:id/react - Add reaction with enhanced error handling
router.post('/posts/:id/react', [
  param('id').isUUID().withMessage('Invalid post ID format'),
  body('reactionType')
    .isIn(['heart', 'like', 'love', 'smile', 'pray'])
    .withMessage('Invalid reaction type'),
  body('reactorName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Reactor name is required and must be between 1 and 255 characters'),
  body('reactorEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
], validateRequest, asyncHandler(async (req, res) => {
  const traceId = req.traceId;
  const postId = req.params.id;
  const { reactionType, reactorName, reactorEmail } = req.body;

  Logger.info('Adding reaction to post', {
    trace_id: traceId,
    post_id: postId,
    reaction_type: reactionType,
    reactor_name: reactorName
  });

  try {
    // First check if post exists
    const postCheck = await databaseService.executeWithFallback('getPost', { traceId }, postId);
    if (!postCheck || !postCheck.post) {
      throw new GalleryPostNotFoundError();
    }

    const reactionData = {
      reaction_type: reactionType,
      reactor_name: reactorName,
      reactor_email: reactorEmail || null,
      reactor_ip: req.ip
    };

    await databaseService.executeWithFallback('addReaction', { traceId }, postId, reactionData);

    Logger.info('Reaction added successfully', {
      trace_id: traceId,
      post_id: postId,
      reaction_type: reactionType
    });

    res.json({ 
      message: 'Reaction added successfully',
      trace_id: traceId
    });

  } catch (error) {
    if (error instanceof GalleryPostNotFoundError) {
      throw error;
    }

    Logger.error('Failed to add reaction', {
      trace_id: traceId,
      post_id: postId,
      error: error.message
    });
    
    throw new GalleryReactionError(
      `Failed to add reaction: ${error.message}`,
      reactionType
    );
  }
}));

// POST /api/gallery/posts/:id/comment - Add comment with enhanced error handling
router.post('/posts/:id/comment', [
  param('id').isUUID().withMessage('Invalid post ID format'),
  body('commenterName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Commenter name is required and must be between 1 and 255 characters'),
  body('commenterEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('commentText')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment is required and must be between 1 and 1000 characters')
], validateRequest, asyncHandler(async (req, res) => {
  const traceId = req.traceId;
  const postId = req.params.id;
  const { commenterName, commenterEmail, commentText } = req.body;

  Logger.info('Adding comment to post', {
    trace_id: traceId,
    post_id: postId,
    commenter_name: commenterName
  });

  try {
    // First check if post exists
    const postCheck = await databaseService.executeWithFallback('getPost', { traceId }, postId);
    if (!postCheck || !postCheck.post) {
      throw new GalleryPostNotFoundError();
    }

    const commentData = {
      commenter_name: commenterName,
      commenter_email: commenterEmail || null,
      commenter_ip: req.ip,
      comment_text: commentText,
      is_approved: false
    };

    const result = await databaseService.executeWithFallback('addComment', { traceId }, postId, commentData);

    Logger.info('Comment added successfully', {
      trace_id: traceId,
      post_id: postId,
      comment_id: result.id
    });

    res.status(201).json({
      message: 'Comment submitted successfully',
      commentId: result.id,
      status: 'pending_approval',
      trace_id: traceId
    });

  } catch (error) {
    if (error instanceof GalleryPostNotFoundError) {
      throw error;
    }

    Logger.error('Failed to add comment', {
      trace_id: traceId,
      post_id: postId,
      error: error.message
    });
    
    throw new GalleryCommentError(
      `Failed to add comment: ${error.message}`
    );
  }
}));

// GET /api/gallery/stats - Get gallery statistics with enhanced error handling
router.get('/stats', asyncHandler(async (req, res) => {
  const traceId = req.traceId;

  Logger.info('Fetching gallery statistics', { trace_id: traceId });

  try {
    const stats = await databaseService.executeWithFallback('getStats', { traceId });

    Logger.info('Gallery statistics retrieved successfully', {
      trace_id: traceId,
      total_posts: stats.total_posts
    });

    res.json(stats);

  } catch (error) {
    Logger.error('Failed to fetch gallery statistics', {
      trace_id: traceId,
      error: error.message
    });
    
    throw error;
  }
}));

// GET /api/gallery/tags - Get all available tags with enhanced error handling
router.get('/tags', asyncHandler(async (req, res) => {
  const traceId = req.traceId;

  Logger.info('Fetching gallery tags', { trace_id: traceId });

  try {
    const tags = await databaseService.executeWithFallback('getTags', { traceId });

    Logger.info('Gallery tags retrieved successfully', {
      trace_id: traceId,
      tag_count: tags.length
    });

    res.json(tags);

  } catch (error) {
    Logger.error('Failed to fetch gallery tags', {
      trace_id: traceId,
      error: error.message
    });
    
    throw error;
  }
}));

// GET /api/gallery/health - Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const traceId = req.traceId;

  try {
    const health = await databaseService.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      trace_id: traceId,
      database: health
    });

  } catch (error) {
    Logger.error('Health check failed', {
      trace_id: traceId,
      error: error.message
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      trace_id: traceId,
      error: error.message
    });
  }
}));

export default router;
