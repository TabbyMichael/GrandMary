import { supabase } from '../supabase-config.js';
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
    
    try {
      // Try Supabase first with circuit breaker and retry
      Logger.info('Attempting Supabase operation', { trace_id: traceId, operation });
      
      return await this.supabaseBreaker.execute(async () => {
        return await RetryManager.withBackoff(async () => {
          return await this.executeSupabaseOperation(operation, ...args);
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
          return await this.executeSQLiteOperation(db, operation, ...args);
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

    let query = supabase
      .from('gallery_posts')
      .select(`
        *,
        gallery_reactions!inner(count),
        gallery_comments!inner(count)
      `, { count: 'exact' });

    query = query.eq('status', 'approved').eq('is_public', true);

    if (type) query = query.eq('file_type', type);
    if (search) query = query.or(`title.ilike.%${search}%,caption.ilike.%${search}%`);
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
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

    return {
      posts: data || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: offset + limit < (count || 0),
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
        .select('reaction_type, count')
        .eq('post_id', id),
      supabase
        .from('gallery_comments')
        .select('*')
        .eq('post_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: true })
    ]);

    const reactions = reactionsResult.status === 'fulfilled' ? reactionsResult.value.data || [] : [];
    const comments = commentsResult.status === 'fulfilled' ? commentsResult.value.data || [] : [];

    return {
      post,
      reactions,
      comments
    };
  }

  async supabaseInsertPost(postData) {
    const { data, error } = await supabase
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
      throw new SupabaseConnectionError(`Get stats failed: ${error.message}`);
    }

    return data;
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

  // SQLite Operations (simplified implementations)
  async sqliteGetPosts(db, options = {}) {
    // This would need the full implementation from gallery-sqlite.js
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteGetPost(db, id) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteInsertPost(db, postData) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteAddReaction(db, postId, reactionData) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteAddComment(db, postId, commentData) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteGetStats(db) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
  }

  async sqliteGetTags(db) {
    throw new SQLiteConnectionError('SQLite operations not fully implemented');
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
