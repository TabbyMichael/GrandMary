import { supabase, supabaseAdmin } from '../supabase-config.js';
import { getDatabase } from '../database/init.js';
import { 
  DatabaseError, 
  SupabaseConnectionError, 
  SQLiteConnectionError,
  CircuitBreakerOpenError 
} from '../errors/index.js';
import { CircuitBreaker, RetryManager, Logger } from '../middleware/errorHandler.js';

class DatabaseService {
  constructor() {
    this.supabaseBreaker = new CircuitBreaker('supabase', {
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 10000
    });
    
    this.sqliteBreaker = new CircuitBreaker('sqlite', {
      failureThreshold: 5,
      resetTimeout: 15000,
      monitoringPeriod: 5000
    });
  }

  async executeWithFallback(operation, ...args) {
    const traceId = args[0]?.traceId || 'N/A';
    const operationArgs = args.slice(1); // Remove trace object from operation args
    
    try {
      // Try Supabase first with circuit breaker and retry
      Logger.info('Attempting Supabase operation', { trace_id: traceId, operation });
      
      return await this.supabaseBreaker.execute(async () => {
        return await RetryManager.withBackoff(async () => {
          return await this.executeSupabaseOperation(operation, ...operationArgs);
        }, {
          maxAttempts: 2,
          baseDelay: 500,
          maxDelay: 2000
        });
      });
      
    } catch (supabaseError) {
      Logger.warn('Supabase operation failed, trying SQLite fallback', {
        trace_id: traceId,
        operation,
        error: supabaseError.message
      });
      
      try {
        return await this.sqliteBreaker.execute(async () => {
          const db = await getDatabase();
          return await this.executeSQLiteOperation(db, operation, ...operationArgs);
        });
      } catch (sqliteError) {
        Logger.error('Both database operations failed', {
          trace_id: traceId,
          operation,
          supabaseError: supabaseError.message,
          sqliteError: sqliteError.message
        });
        
        throw new DatabaseError(
          `All database operations failed. Supabase: ${supabaseError.message}, SQLite: ${sqliteError.message}`,
          { supabaseError, sqliteError }
        );
      }
    }
  }

  async executeSupabaseOperation(operation, ...args) {
    switch (operation) {
      case 'getPosts':
        return await this.supabaseGetPosts(...args);
      case 'getPost':
        return await this.supabaseGetPost(...args);
      case 'insertPost':
        return await this.supabaseInsertPost(...args);
      case 'addReaction':
        return await this.supabaseAddReaction(...args);
      case 'addComment':
        return await this.supabaseAddComment(...args);
      case 'getStats':
        return await this.supabaseGetStats();
      case 'getTags':
        return await this.supabaseGetTags();
      default:
        throw new DatabaseError(`Unknown Supabase operation: ${operation}`);
    }
  }

  async executeSQLiteOperation(db, operation, ...args) {
    switch (operation) {
      case 'getPosts':
        return await this.sqliteGetPosts(db, ...args);
      case 'getPost':
        return await this.sqliteGetPost(db, ...args);
      case 'insertPost':
        return await this.sqliteInsertPost(db, ...args);
      case 'addReaction':
        return await this.sqliteAddReaction(db, ...args);
      case 'addComment':
        return await this.sqliteAddComment(db, ...args);
      case 'getStats':
        return await this.sqliteGetStats(db);
      case 'getTags':
        return await this.sqliteGetTags(db);
      default:
        throw new DatabaseError(`Unknown SQLite operation: ${operation}`);
    }
  }

  // Supabase Operations
  async supabaseGetPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      tags = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Use left joins by removing !inner to ensure all posts are returned
    // even those without reactions or comments
    let query = supabase
      .from('gallery_posts')
      .select(`
        *,
        gallery_reactions(count),
        gallery_comments(count)
      `, { count: 'exact' });

    query = query.eq('status', 'approved').eq('is_public', true);

    if (type) query = query.eq('file_type', type);
    if (search) query = query.or(`title.ilike.%${search}%,caption.ilike.%${search}%`);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      query = query.contains('tags', tagArray);
    }

    const offset = (page - 1) * limit;
    query = query
      .order(sortBy, { ascending: sortOrder === 'ASC' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new SupabaseConnectionError(`Query failed: ${error.message}`);
    }

    // Fix: PostgREST count might be null if there are issues with the query
    // In that case, use data.length as fallback for total count if it's the only page
    const totalItems = count !== null ? count : (page === 1 && data.length < limit ? data.length : 0);

    return {
      posts: data || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: offset + limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  async supabaseGetPost(id) {
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        throw new Error('Post not found');
      }
      throw new SupabaseConnectionError(`Get post failed: ${postError.message}`);
    }

    // Get reactions and comments in parallel
    const [reactionsResult, commentsResult] = await Promise.allSettled([
      supabase
        .from('gallery_reactions')
        .select('reaction_type')
        .eq('post_id', id),
      supabase
        .from('gallery_comments')
        .select('*')
        .eq('post_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: true })
    ]);

    const rawReactions = reactionsResult.status === 'fulfilled' ? reactionsResult.value.data || [] : [];
    
    // Group reactions by type and count them
    const reactionCounts = {};
    rawReactions.forEach(r => {
      reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
    });
    
    const reactions = Object.entries(reactionCounts).map(([type, count]) => ({
      reaction_type: type,
      count
    }));

    const comments = commentsResult.status === 'fulfilled' ? commentsResult.value.data || [] : [];

    return {
      post,
      reactions,
      comments
    };
  }

  async supabaseInsertPost(postData) {
    const { data, error } = await supabaseAdmin
      .from('gallery_posts')
      .insert([postData])
      .select();

    if (error) {
      throw new SupabaseConnectionError(`Insert failed: ${error.message}`);
    }

    return data[0];
  }

  async supabaseAddReaction(postId, reactionData) {
    const { data, error } = await supabase
      .from('gallery_reactions')
      .upsert([{
        post_id: postId,
        ...reactionData
      }])
      .select();

    if (error) {
      throw new SupabaseConnectionError(`Add reaction failed: ${error.message}`);
    }

    return data[0];
  }

  async supabaseAddComment(postId, commentData) {
    const { data, error } = await supabase
      .from('gallery_comments')
      .insert([{
        post_id: postId,
        ...commentData
      }])
      .select();

    if (error) {
      throw new SupabaseConnectionError(`Add comment failed: ${error.message}`);
    }

    return data[0];
  }

  async supabaseGetStats() {
    // Get total posts
    const { data: totalData, error: totalError } = await supabase
      .from('gallery_posts')
      .select('count')
      .single();

    // Get image posts
    const { data: imageData, error: imageError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('file_type', 'image')
      .single();

    // Get video posts
    const { data: videoData, error: videoError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('file_type', 'video')
      .single();

    // Get approved posts
    const { data: approvedData, error: approvedError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('status', 'approved')
      .single();

    // Get pending posts
    const { data: pendingData, error: pendingError } = await supabase
      .from('gallery_posts')
      .select('count')
      .eq('status', 'pending')
      .single();

    // Get unique uploaders
    const { data: uploaderData, error: uploaderError } = await supabase
      .from('gallery_posts')
      .select('uploader_ip')
      .not('uploader_ip', 'is', null);

    // Get storage stats
    const { data: storageData, error: storageError } = await supabase
      .from('gallery_posts')
      .select('file_size')
      .not('file_size', 'is', null);

    // Check for any errors
    if (totalError || imageError || videoError || approvedError || pendingError || uploaderError || storageError) {
      throw new SupabaseConnectionError(`Get stats failed: ${totalError?.message || imageError?.message || videoError?.message || approvedError?.message || pendingError?.message || uploaderError?.message || storageError?.message}`);
    }

    // Calculate stats
    const uniqueUploaders = uploaderData ? [...new Set(uploaderData.map(d => d.uploader_ip))].length : 0;
    const totalStorage = storageData ? storageData.reduce((sum, d) => sum + (d.file_size || 0), 0) : 0;
    const avgFileSize = storageData && storageData.length > 0 ? totalStorage / storageData.length : 0;

    return {
      total_posts: totalData?.count || 0,
      total_images: imageData?.count || 0,
      total_videos: videoData?.count || 0,
      approved_posts: approvedData?.count || 0,
      pending_posts: pendingData?.count || 0,
      unique_uploaders: uniqueUploaders,
      total_storage_used: totalStorage,
      average_file_size: avgFileSize
    };
  }

  async supabaseGetTags() {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('tags')
      .eq('status', 'approved')
      .eq('is_public', true)
      .not('tags', 'is', null);

    if (error) {
      throw new SupabaseConnectionError(`Get tags failed: ${error.message}`);
    }

    const tagCounts = {};
    data.forEach(post => {
      const tags = post.tags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // SQLite Operations
  async sqliteGetPosts(db, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      tags = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE gp.status = ? AND gp.is_public = ?';
    let queryParams = ['approved', 1];

    if (type) {
      whereClause += ' AND gp.file_type = ?';
      queryParams.push(type);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      whereClause += ` AND gp.tags LIKE ?`;
      queryParams.push(`%${tagArray[0]}%`);
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

    try {
      // Get posts
      const posts = await new Promise((resolve, reject) => {
        const query = `
          SELECT 
            gp.*,
            (SELECT COUNT(*) FROM gallery_reactions gr WHERE gr.post_id = gp.id) as reaction_count,
            (SELECT COUNT(*) FROM gallery_comments gc WHERE gc.post_id = gp.id AND gc.is_approved = 1) as comment_count
          FROM gallery_posts gp
          ${whereClause}
          ORDER BY gp.${sortColumn} ${sortDirection}
          LIMIT ? OFFSET ?
        `;

        db.all(query, [...queryParams, limit, offset], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      // Get total count
      const totalItems = await new Promise((resolve, reject) => {
        const countQuery = `SELECT COUNT(*) as total FROM gallery_posts gp ${whereClause}`;
        db.get(countQuery, queryParams, (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        });
      });

      const formattedPosts = posts.map(post => ({
        ...post,
        tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : (post.tags || []),
        gallery_reactions: [{ count: post.reaction_count }],
        gallery_comments: [{ count: post.comment_count }]
      }));

      return {
        posts: formattedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems: totalItems,
          itemsPerPage: limit,
          hasNextPage: offset + limit < totalItems,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite query failed: ${error.message}`);
    }
  }

  async sqliteGetPost(db, id) {
    try {
      const post = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM gallery_posts WHERE id = ? AND status = ? AND is_public = ?',
          [id, 'approved', 1],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!post) return null;

      const reactions = await new Promise((resolve, reject) => {
        db.all(
          'SELECT reaction_type, COUNT(*) as count FROM gallery_reactions WHERE post_id = ? GROUP BY reaction_type',
          [id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      const comments = await new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM gallery_comments WHERE post_id = ? AND is_approved = ? ORDER BY created_at ASC',
          [id, 1],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      return {
        post: {
          ...post,
          tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : (post.tags || [])
        },
        reactions,
        comments
      };
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite get post failed: ${error.message}`);
    }
  }

  async sqliteInsertPost(db, postData) {
    try {
      const result = await new Promise((resolve, reject) => {
        const columns = Object.keys(postData).join(', ');
        const placeholders = Object.keys(postData).map(() => '?').join(', ');
        const values = Object.values(postData).map(v => 
          Array.isArray(v) ? JSON.stringify(v) : v
        );

        db.run(
          `INSERT INTO gallery_posts (${columns}) VALUES (${placeholders})`,
          values,
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      return { id: result.id, ...postData };
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite insert failed: ${error.message}`);
    }
  }

  async sqliteAddReaction(db, postId, reactionData) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO gallery_reactions 
          (post_id, reaction_type, reactor_name, reactor_email, reactor_ip) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            postId, 
            reactionData.reaction_type, 
            reactionData.reactor_name, 
            reactionData.reactor_email, 
            reactionData.reactor_ip
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      return { success: true };
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite add reaction failed: ${error.message}`);
    }
  }

  async sqliteAddComment(db, postId, commentData) {
    try {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO gallery_comments 
          (post_id, commenter_name, commenter_email, commenter_ip, comment_text, is_approved) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            postId, 
            commentData.commenter_name, 
            commentData.commenter_email, 
            commentData.commenter_ip, 
            commentData.comment_text,
            commentData.is_approved ? 1 : 0
          ],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });
      return { id: result.id, ...commentData };
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite add comment failed: ${error.message}`);
    }
  }

  async sqliteGetStats(db) {
    try {
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
      return stats;
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite get stats failed: ${error.message}`);
    }
  }

  async sqliteGetTags(db) {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`
          SELECT DISTINCT tags FROM gallery_posts 
          WHERE status = 'approved' AND is_public = 1 AND tags IS NOT NULL
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      const tagCounts = {};
      rows.forEach(row => {
        try {
          const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
          tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } catch (e) {}
      });

      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      throw new SQLiteConnectionError(`SQLite get tags failed: ${error.message}`);
    }
  }

  // Health Check
  async healthCheck() {
    const health = {
      supabase: 'unknown',
      sqlite: 'unknown',
      overall: 'unknown'
    };

    try {
      await this.supabaseBreaker.execute(async () => {
        await supabase.from('gallery_posts').select('count').limit(1);
      });
      health.supabase = 'healthy';
    } catch (error) {
      health.supabase = 'unhealthy';
      Logger.warn('Supabase health check failed', { error: error.message });
    }

    try {
      await this.sqliteBreaker.execute(async () => {
        const db = await getDatabase();
        await db.get('SELECT 1');
      });
      health.sqlite = 'healthy';
    } catch (error) {
      health.sqlite = 'unhealthy';
      Logger.warn('SQLite health check failed', { error: error.message });
    }

    health.overall = health.supabase === 'healthy' || health.sqlite === 'healthy' ? 'healthy' : 'unhealthy';

    return health;
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
