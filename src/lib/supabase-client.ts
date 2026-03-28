import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Gallery service functions
export const galleryService = {
  // Get all posts with pagination and filtering
  async getPosts(options: {
    page?: number;
    limit?: number;
    type?: string | null;
    tags?: string | null;
    search?: string | null;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
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
        id,
        uploader_name,
        uploader_relationship,
        title,
        caption,
        file_name,
        original_file_name,
        file_type,
        mime_type,
        file_size,
        file_path,
        thumbnail_path,
        tags,
        event_date,
        location,
        created_at,
        updated_at,
        gallery_reactions(count),
        gallery_comments(count)
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

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    // Transform the data to match the expected format
    const transformedData = (data || []).map(post => ({
      ...post,
      reaction_count: post.gallery_reactions?.[0]?.count || 0,
      comment_count: post.gallery_comments?.[0]?.count || 0
    }));

    return {
      posts: transformedData,
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
  async getPost(id: string) {
    const { data: post, error: postError } = await supabase
      .from('gallery_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .eq('is_public', true)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      throw postError;
    }

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

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      throw reactionsError;
    }

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      throw commentsError;
    }

    return {
      post,
      reactions: reactions || [],
      comments: comments || []
    };
  },

  // Upload new post
  async uploadPost(postData: any) {
    const { data, error } = await supabase
      .from('gallery_posts')
      .insert([{
        ...postData,
        status: 'pending', // Requires admin approval
      }])
      .select()
      .single();

    if (error) {
      console.error('Error uploading post:', error);
      throw error;
    }

    return data;
  },

  // Add reaction to post
  async addReaction(postId: string, reactionData: any) {
    const { data, error } = await supabase
      .from('gallery_reactions')
      .upsert([{
        post_id: postId,
        ...reactionData,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }

    return data;
  },

  // Add comment to post
  async addComment(postId: string, commentData: any) {
    const { data, error } = await supabase
      .from('gallery_comments')
      .insert([{
        post_id: postId,
        ...commentData,
        is_approved: false, // Requires admin approval
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data;
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

    if (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }

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

    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }

    // Count tag occurrences
    const tagCounts: { [key: string]: number } = {};
    data.forEach(post => {
      const tags = post.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Upload file to Supabase Storage
  async uploadFile(file: File, fileName: string) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${fileName}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      publicUrl,
      ...data
    };
  }
};

export default galleryService;
