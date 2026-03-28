import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Gallery posts table functions
export const galleryService = {
  // Get all posts with pagination and filtering
  async getPosts(options = {}) {
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
  },

  // Get single post with reactions and comments
  async getPost(id) {
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError) throw postError;

    // Get reactions
    const { data: reactions, error: reactionsError } = await supabase
      .from('gallery_reactions')
      .select('reaction_type, count')
      .eq('post_id', id);

    // Get approved comments
    const { data: comments, error: commentsError } = await supabase
      .from('gallery_comments')
      .select('*')
      .eq('post_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (reactionsError) throw reactionsError;
    if (commentsError) throw commentsError;

    return {
      post,
      reactions: reactions || [],
      comments: comments || []
    };
  },

  // Upload new post
  async uploadPost(postData) {
    const { data, error } = await supabase
      .from('gallery_posts')
      .insert([{
        ...postData,
        status: 'pending', // Requires admin approval
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Add reaction to post
  async addReaction(postId, reactionData) {
    const { data, error } = await supabase
      .from('gallery_reactions')
      .upsert([{
        post_id: postId,
        ...reactionData,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Add comment to post
  async addComment(postId, commentData) {
    const { data, error } = await supabase
      .from('gallery_comments')
      .insert([{
        post_id: postId,
        ...commentData,
        is_approved: false, // Requires admin approval
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get gallery statistics
  async getStats() {
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
  },

  // Get popular tags
  async getTags() {
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('tags')
      .eq('status', 'approved')
      .eq('is_public', true)
      .not('tags', 'is', null);

    if (error) throw error;

    // Count tag occurrences
    const tagCounts = {};
    data.forEach(post => {
      try {
        const tags = JSON.parse(post.tags || '[]');
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      } catch (e) {
        // Skip invalid JSON
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
};

export default galleryService;
