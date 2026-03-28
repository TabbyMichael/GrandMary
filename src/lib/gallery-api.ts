const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface GalleryPost {
  id: number;
  uploader_name: string;
  uploader_email?: string;
  title?: string;
  caption?: string;
  file_name: string;
  original_file_name: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  tags: string[];
  is_public: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  event_date?: string;
  location?: string;
  reaction_count?: number;
  comment_count?: number;
  view_count?: number;
}

export interface GalleryStats {
  total_posts: number;
  total_images: number;
  total_videos: number;
  approved_posts: number;
  pending_posts: number;
  unique_uploaders: number;
  total_storage_used: number;
  average_file_size: number;
}

export interface GalleryReaction {
  reaction_type: string;
  count: number;
}

export interface GalleryComment {
  id: number;
  post_id: number;
  commenter_name: string;
  commenter_email?: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
}

export interface GalleryUploadResponse {
  message: string;
  files: Array<{
    id: number;
    fileName: string;
    originalName: string;
    fileType: 'image' | 'video';
    size: number;
    mimeType: string;
  }>;
  status: string;
}

export interface GalleryPostsResponse {
  posts: GalleryPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GalleryPostResponse {
  post: GalleryPost;
  reactions: GalleryReaction[];
  comments: GalleryComment[];
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

export const galleryApi = {
  // Upload files to gallery
  uploadFiles: async (formData: FormData): Promise<GalleryUploadResponse> => {
    const url = `${API_BASE_URL}/gallery/upload`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  },

  // Get gallery posts with pagination and filtering
  getPosts: async (params: {
    page?: number;
    limit?: number;
    type?: 'image' | 'video';
    tags?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<GalleryPostsResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString();
    return apiRequest<GalleryPostsResponse>(`/gallery/posts${query ? `?${query}` : ''}`);
  },

  // Get single post with reactions and comments
  getPost: async (id: number): Promise<GalleryPostResponse> => {
    return apiRequest<GalleryPostResponse>(`/gallery/posts/${id}`);
  },

  // Add reaction to post
  addReaction: async (postId: number, data: {
    reactionType: string;
    reactorName: string;
    reactorEmail?: string;
  }): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/gallery/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Add comment to post
  addComment: async (postId: number, data: {
    commenterName: string;
    commenterEmail?: string;
    commentText: string;
  }): Promise<{ message: string; commentId: number; status: string }> => {
    return apiRequest<{ message: string; commentId: number; status: string }>(`/gallery/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get gallery statistics
  getStats: async (): Promise<GalleryStats> => {
    return apiRequest<GalleryStats>('/gallery/stats');
  },

  // Get available tags
  getTags: async (): Promise<Array<{ tag: string; count: number }>> => {
    return apiRequest<Array<{ tag: string; count: number }>>('/gallery/tags');
  },
};
