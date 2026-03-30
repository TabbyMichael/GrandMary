import { supabase } from '../supabase-config.js';
import { getDatabase } from './init.js';

class DatabaseManager {
  constructor() {
    this.primary = 'supabase'; // 'supabase' or 'sqlite'
    this.fallbackEnabled = true;
  }

  // Test Supabase connection
  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('gallery_posts')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
  }

  // Test SQLite connection
  async testSQLiteConnection() {
    try {
      const db = await getDatabase();
      await db.get('SELECT 1');
      return true;
    } catch (error) {
      console.error('SQLite connection test error:', error);
      return false;
    }
  }

  // Get available database connections
  async getAvailableConnections() {
    const connections = {};
    
    const supabaseConnected = await this.testSupabaseConnection();
    if (supabaseConnected) {
      connections.supabase = true;
    }

    const sqliteConnected = await this.testSQLiteConnection();
    if (sqliteConnected) {
      connections.sqlite = true;
    }

    return connections;
  }

  // Execute operation with fallback
  async executeWithFallback(operation, ...args) {
    // Try Supabase first
    if (this.primary === 'supabase') {
      try {
        const result = await this.executeSupabaseOperation(operation, ...args);
        return result;
      } catch (error) {
        console.error('Supabase operation failed:', error);
        
        if (this.fallbackEnabled) {
          console.log('Falling back to SQLite...');
          try {
            const result = await this.executeSQLiteOperation(operation, ...args);
            return result;
          } catch (fallbackError) {
            console.error('SQLite fallback also failed:', fallbackError);
            throw new Error('Both primary and fallback databases failed');
          }
        } else {
          throw error;
        }
      }
    }
    
    // Try SQLite first (if configured as primary)
    if (this.primary === 'sqlite') {
      try {
        const result = await this.executeSQLiteOperation(operation, ...args);
        return result;
      } catch (error) {
        console.error('SQLite operation failed:', error);
        
        if (this.fallbackEnabled) {
          console.log('Falling back to Supabase...');
          try {
            const result = await this.executeSupabaseOperation(operation, ...args);
            return result;
          } catch (fallbackError) {
            console.error('Supabase fallback also failed:', fallbackError);
            throw new Error('Both primary and fallback databases failed');
          }
        } else {
          throw error;
        }
      }
    }
  }

  // Execute Supabase operation
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
        throw new Error(`Unknown Supabase operation: ${operation}`);
    }
  }

  // Execute SQLite operation
  async executeSQLiteOperation(operation, ...args) {
    const db = await getDatabase();
    
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
        throw new Error(`Unknown SQLite operation: ${operation}`);
    }
  }

  // Supabase operations
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
    if (error) throw error;

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

    if (postError) throw postError;

    const { data: reactions, error: reactionsError } = await supabase
      .from('gallery_reactions')
      .select('reaction_type, count')
      .eq('post_id', id);

    const { data: comments, error: commentsError } = await supabase
      .from('gallery_comments')
      .select('*')
      .eq('post_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    return {
      post,
      reactions: reactions || [],
      comments: comments || []
    };
  }

  async supabaseInsertPost(postData) {
    const { data, error } = await supabase
      .from('gallery_posts')
      .insert([postData])
      .select();

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
    return data;
  }

  async supabaseGetTags() {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('tags')
      .eq('status', 'approved')
      .eq('is_public', true)
      .not('tags', 'is', null);

    if (error) throw error;

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

  // SQLite operations (simplified versions)
  async sqliteGetPosts(db, options = {}) {
    // This is a placeholder - you'd need to implement the full SQLite logic
    // from gallery-sqlite.js here
    throw new Error('SQLite getPosts not fully implemented');
  }

  async sqliteGetPost(db, id) {
    // Placeholder implementation
    throw new Error('SQLite getPost not fully implemented');
  }

  async sqliteInsertPost(db, postData) {
    // Placeholder implementation
    throw new Error('SQLite insertPost not fully implemented');
  }

  async sqliteAddReaction(db, postId, reactionData) {
    // Placeholder implementation
    throw new Error('SQLite addReaction not fully implemented');
  }

  async sqliteAddComment(db, postId, commentData) {
    // Placeholder implementation
    throw new Error('SQLite addComment not fully implemented');
  }

  async sqliteGetStats(db) {
    // Placeholder implementation
    throw new Error('SQLite getStats not fully implemented');
  }

  async sqliteGetTags(db) {
    // Placeholder implementation
    throw new Error('SQLite getTags not fully implemented');
  }

  // Health check for both databases
  async healthCheck() {
    const health = {
      primary: this.primary,
      fallback: this.fallbackEnabled,
      connections: {}
    };

    health.connections.supabase = await this.testSupabaseConnection();
    health.connections.sqlite = await this.testSQLiteConnection();

    health.healthy = health.connections[this.primary] || 
                    (this.fallbackEnabled && 
                     Object.values(health.connections).some(connected => connected));

    return health;
  }
}

export const databaseManager = new DatabaseManager();
export default databaseManager;
