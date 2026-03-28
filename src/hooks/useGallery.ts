import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { galleryApi, type GalleryPost, type GalleryStats, type GalleryUploadResponse } from '@/lib/gallery-api';

export const useGallery = (initialPage = 1, initialLimit = 20) => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: initialLimit,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchPosts = async (params: {
    page?: number;
    limit?: number;
    type?: 'image' | 'video';
    tags?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryApi.getPosts({
        page: params.page || pagination.currentPage,
        limit: params.limit || pagination.itemsPerPage,
        ...params,
      });
      
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      toast.error('Failed to load gallery posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    pagination,
    fetchPosts,
    refetch: () => fetchPosts(),
  };
};

export const useGalleryStats = () => {
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryApi.getStats();
      setStats(response);
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      console.error('Failed to fetch gallery stats:', apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

export const useGalleryUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (formData: FormData): Promise<GalleryUploadResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryApi.uploadFiles(formData);
      toast.success(response.message);
      return response;
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      toast.error(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadFiles,
    loading,
    error,
  };
};

export const useGalleryPost = (postId: number) => {
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [reactions, setReactions] = useState<Array<{ reaction_type: string; count: number }>>([]);
  const [comments, setComments] = useState<Array<{ id: number; commenter_name: string; comment_text: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryApi.getPost(postId);
      setPost(response.post);
      setReactions(response.reactions);
      setComments(response.comments);
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (reactionType: string, reactorName: string, reactorEmail?: string) => {
    try {
      await galleryApi.addReaction(postId, { reactionType, reactorName, reactorEmail });
      toast.success('Reaction added successfully');
      await fetchPost(); // Refresh post data
    } catch (err) {
      const apiError = err as Error;
      toast.error(apiError.message);
    }
  };

  const addComment = async (commenterName: string, commentText: string, commenterEmail?: string) => {
    try {
      await galleryApi.addComment(postId, { commenterName, commentText, commenterEmail });
      toast.success('Comment submitted successfully');
      await fetchPost(); // Refresh post data
    } catch (err) {
      const apiError = err as Error;
      toast.error(apiError.message);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  return {
    post,
    reactions,
    comments,
    loading,
    error,
    fetchPost,
    addReaction,
    addComment,
  };
};

export const useGalleryTags = () => {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryApi.getTags();
      setTags(response);
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      console.error('Failed to fetch tags:', apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tags,
    loading,
    error,
    fetchTags,
  };
};
