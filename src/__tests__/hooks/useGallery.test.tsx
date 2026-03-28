import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGallery, useGalleryStats, useGalleryUpload, useGalleryPost, useGalleryTags } from '@/hooks/useGallery';
import { galleryApi } from '@/lib/gallery-api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/gallery-api', () => ({
  galleryApi: {
    getPosts: vi.fn(),
    getPost: vi.fn(),
    getStats: vi.fn(),
    uploadFiles: vi.fn(),
    addReaction: vi.fn(),
    addComment: vi.fn(),
    getTags: vi.fn()
  }
}));
vi.mock('sonner');

const mockGalleryApi = vi.mocked(galleryApi);
const mockToast = vi.mocked(toast);

describe('Gallery Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useGallery', () => {
    it('should initialize with default values', () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });

      // Act
      const { result } = renderHook(() => useGallery());

      // Assert
      expect(result.current.posts).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });

    it('should fetch posts on mount', async () => {
      // Arrange
      const mockPosts = [
        { 
          id: 1, 
          title: 'Test Post', 
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        { 
          id: 2, 
          title: 'Another Post', 
          file_type: 'video' as const,
          uploader_name: 'Test User',
          file_name: 'test.mp4',
          original_file_name: 'test.mp4',
          mime_type: 'video/mp4',
          file_size: 2048,
          file_path: '/uploads/test.mp4',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];
      const mockResponse = {
        posts: mockPosts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
      mockGalleryApi.getPosts.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useGallery());

      // Assert
      await waitFor(() => {
        expect(result.current.posts).toEqual(mockPosts);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGalleryApi.getPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20
      });
    });

    it('should handle fetch posts error', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockGalleryApi.getPosts.mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useGallery());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to load gallery posts');
    });

    it('should fetch posts with custom parameters', async () => {
      // Arrange
      const mockResponse = {
        posts: [],
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 100,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPreviousPage: true
        }
      };
      mockGalleryApi.getPosts.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useGallery(2, 10));

      await waitFor(() => {
        expect(result.current.pagination.currentPage).toBe(2);
        expect(result.current.pagination.itemsPerPage).toBe(10);
      });

      // Act - fetch with custom params
      act(() => {
        result.current.fetchPosts({
          page: 3,
          limit: 15,
          type: 'image',
          search: 'test',
          sortBy: 'title',
          sortOrder: 'ASC'
        });
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getPosts).toHaveBeenCalledWith({
          page: 3,
          limit: 15,
          type: 'image',
          search: 'test',
          sortBy: 'title',
          sortOrder: 'ASC'
        });
      });
    });

    it('should refetch posts', async () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPreviousPage: false }
      });

      // Act
      const { result } = renderHook(() => useGallery());

      await waitFor(() => {
        expect(mockGalleryApi.getPosts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.refetch();
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getPosts).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle concurrent fetch requests', async () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPreviousPage: false }
      });

      // Act
      const { result } = renderHook(() => useGallery());

      // Simulate concurrent requests
      act(() => {
        result.current.fetchPosts({ page: 1 });
        result.current.fetchPosts({ page: 2 });
        result.current.fetchPosts({ page: 3 });
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getPosts).toHaveBeenCalledTimes(4); // Initial + 3 concurrent
      });
    });
  });

  describe('useGalleryStats', () => {
    it('should initialize with default values', () => {
      // Arrange
      mockGalleryApi.getStats.mockResolvedValue({
        total_posts: 0,
        total_images: 0,
        total_videos: 0,
        approved_posts: 0,
        pending_posts: 0,
        unique_uploaders: 0,
        total_storage_used: 0,
        average_file_size: 0
      });

      // Act
      const { result } = renderHook(() => useGalleryStats());

      // Assert
      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fetch stats on mount', async () => {
      // Arrange
      const mockStats = {
        total_posts: 100,
        total_images: 80,
        total_videos: 20,
        approved_posts: 95,
        pending_posts: 5,
        unique_uploaders: 50,
        total_storage_used: 1000000,
        average_file_size: 10000
      };
      mockGalleryApi.getStats.mockResolvedValue(mockStats);

      // Act
      const { result } = renderHook(() => useGalleryStats());

      // Assert
      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGalleryApi.getStats).toHaveBeenCalledTimes(1);
    });

    it('should handle stats fetch error', async () => {
      // Arrange
      const mockError = new Error('Stats fetch failed');
      mockGalleryApi.getStats.mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useGalleryStats());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Stats fetch failed');
      });

      expect(vi.mocked(console.error)).toHaveBeenCalledWith('Failed to fetch gallery stats:', mockError);
    });

    it('should allow manual stats refresh', async () => {
      // Arrange
      mockGalleryApi.getStats.mockResolvedValue({
        total_posts: 50,
        total_images: 40,
        total_videos: 10,
        approved_posts: 45,
        pending_posts: 5,
        unique_uploaders: 25,
        total_storage_used: 500000,
        average_file_size: 5000
      });

      // Act
      const { result } = renderHook(() => useGalleryStats());

      await waitFor(() => {
        expect(mockGalleryApi.getStats).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.fetchStats();
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useGalleryUpload', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useGalleryUpload());

      // Assert
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should upload files successfully', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('files', new File(['test'], 'test.jpg'));
      formData.append('uploaderName', 'John Doe');

      const mockResponse = {
        message: 'Files uploaded successfully',
        files: [{ 
          id: 1, 
          fileName: 'test.jpg',
          originalName: 'test.jpg',
          fileType: 'image' as const,
          size: 1024,
          mimeType: 'image/jpeg'
        }],
        status: 'success'
      };
      mockGalleryApi.uploadFiles.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useGalleryUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadFiles(formData);
      });

      // Assert
      expect(uploadResult).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockToast.success).toHaveBeenCalledWith('Files uploaded successfully');
    });

    it('should handle upload error', async () => {
      // Arrange
      const formData = new FormData();
      const mockError = new Error('Upload failed');
      mockGalleryApi.uploadFiles.mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useGalleryUpload());

      // Act & Assert
      await expect(result.current.uploadFiles(formData)).rejects.toThrow('Upload failed');
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Upload failed');
      });
      expect(mockToast.error).toHaveBeenCalledWith('Upload failed');
    });

    it('should handle concurrent uploads', async () => {
      // Arrange
      const formData = new FormData();
      mockGalleryApi.uploadFiles.mockResolvedValue({
        message: 'Upload successful',
        files: [],
        status: 'success'
      });

      // Act
      const { result } = renderHook(() => useGalleryUpload());

      // Act & Assert
      const uploadPromises = [
        result.current.uploadFiles(formData),
        result.current.uploadFiles(formData),
        result.current.uploadFiles(formData)
      ];

      await act(async () => {
        await Promise.all(uploadPromises);
      });

      expect(mockGalleryApi.uploadFiles).toHaveBeenCalledTimes(3);
    });
  });

  describe('useGalleryPost', () => {
    it('should initialize with default values', () => {
      // Arrange
      mockGalleryApi.getPost.mockResolvedValue({
        post: null,
        reactions: [],
        comments: []
      });

      // Act
      const { result } = renderHook(() => useGalleryPost(1));

      // Assert
      expect(result.current.post).toBeNull();
      expect(result.current.reactions).toEqual([]);
      expect(result.current.comments).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fetch post data on mount', async () => {
      // Arrange
      const postId = 1;
      const mockPostData = {
        post: { 
          id: postId, 
          title: 'Test Post',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        reactions: [{ reaction_type: 'heart', count: 5 }],
        comments: [{ 
          id: 1, 
          post_id: postId,
          commenter_name: 'John', 
          comment_text: 'Great post!',
          is_approved: true,
          created_at: '2023-01-01T00:00:00Z'
        }]
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData);

      // Act
      const { result } = renderHook(() => useGalleryPost(postId));

      // Assert
      await waitFor(() => {
        expect(result.current.post).toEqual(mockPostData.post);
        expect(result.current.reactions).toEqual(mockPostData.reactions);
        expect(result.current.comments).toEqual(mockPostData.comments);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGalleryApi.getPost).toHaveBeenCalledWith(postId);
    });

    it('should not fetch when postId is 0 or null', () => {
      // Act
      const { result: result1 } = renderHook(() => useGalleryPost(0));
      const { result: result2 } = renderHook(() => useGalleryPost(null as any));

      // Assert
      expect(mockGalleryApi.getPost).not.toHaveBeenCalled();
      expect(result1.current.post).toBeNull();
      expect(result2.current.post).toBeNull();
    });

    it('should add reaction successfully', async () => {
      // Arrange
      const postId = 1;
      const mockPostData = {
        post: { 
          id: postId, 
          title: 'Test Post',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        reactions: [],
        comments: []
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData);
      mockGalleryApi.addReaction.mockResolvedValue({ message: 'Reaction added successfully' });

      // Act
      const { result } = renderHook(() => useGalleryPost(postId));

      await waitFor(() => {
        expect(result.current.post).not.toBeNull();
      });

      await act(async () => {
        await result.current.addReaction('heart', 'John Doe', 'john@example.com');
      });

      // Assert
      expect(mockGalleryApi.addReaction).toHaveBeenCalledWith(postId, {
        reactionType: 'heart',
        reactorName: 'John Doe',
        reactorEmail: 'john@example.com'
      });
      expect(mockToast.success).toHaveBeenCalledWith('Reaction added successfully');
      expect(mockGalleryApi.getPost).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should handle reaction error', async () => {
      // Arrange
      const postId = 1;
      const mockPostData = {
        post: { 
          id: postId, 
          title: 'Test Post',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        reactions: [],
        comments: []
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData);
      mockGalleryApi.addReaction.mockRejectedValue(new Error('Reaction failed'));

      // Act
      const { result } = renderHook(() => useGalleryPost(postId));

      await waitFor(() => {
        expect(result.current.post).not.toBeNull();
      });

      await act(async () => {
        await result.current.addReaction('heart', 'John Doe');
      });

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Reaction failed');
    });

    it('should add comment successfully', async () => {
      // Arrange
      const postId = 1;
      const mockPostData = {
        post: { 
          id: postId, 
          title: 'Test Post',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        reactions: [],
        comments: []
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData);
      mockGalleryApi.addComment.mockResolvedValue({ 
        message: 'Comment submitted successfully',
        commentId: 1,
        status: 'pending'
      });

      // Act
      const { result } = renderHook(() => useGalleryPost(postId));

      await waitFor(() => {
        expect(result.current.post).not.toBeNull();
      });

      await act(async () => {
        await result.current.addComment('John Doe', 'Great post!', 'john@example.com');
      });

      // Assert
      expect(mockGalleryApi.addComment).toHaveBeenCalledWith(postId, {
        commenterName: 'John Doe',
        commentText: 'Great post!',
        commenterEmail: 'john@example.com'
      });
      expect(mockToast.success).toHaveBeenCalledWith('Comment submitted successfully');
      expect(mockGalleryApi.getPost).toHaveBeenCalledTimes(2);
    });

    it('should handle comment error', async () => {
      // Arrange
      const postId = 1;
      const mockPostData = {
        post: { 
          id: postId, 
          title: 'Test Post',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test.jpg',
          original_file_name: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        reactions: [],
        comments: []
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData);
      mockGalleryApi.addComment.mockRejectedValue(new Error('Comment failed'));

      // Act
      const { result } = renderHook(() => useGalleryPost(postId));

      await waitFor(() => {
        expect(result.current.post).not.toBeNull();
      });

      await act(async () => {
        await result.current.addComment('John Doe', 'Great post!');
      });

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Comment failed');
    });

    it('should refetch post when postId changes', async () => {
      // Arrange
      const mockPostData1 = { 
        post: { 
          id: 1, 
          title: 'Post 1',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test1.jpg',
          original_file_name: 'test1.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test1.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }, 
        reactions: [], 
        comments: [] 
      };
      const mockPostData2 = { 
        post: { 
          id: 2, 
          title: 'Post 2',
          file_type: 'image' as const,
          uploader_name: 'Test User',
          file_name: 'test2.jpg',
          original_file_name: 'test2.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          file_path: '/uploads/test2.jpg',
          tags: [],
          is_public: true,
          status: 'approved' as const,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }, 
        reactions: [], 
        comments: [] 
      };
      mockGalleryApi.getPost.mockResolvedValue(mockPostData1);

      // Act
      const { result, rerender } = renderHook(
        ({ postId }) => useGalleryPost(postId),
        { initialProps: { postId: 1 } }
      );

      await waitFor(() => {
        expect(result.current.post?.id).toBe(1);
      });

      // Act - Change postId
      mockGalleryApi.getPost.mockResolvedValue(mockPostData2);
      rerender({ postId: 2 });

      // Assert
      await waitFor(() => {
        expect(result.current.post?.id).toBe(2);
      });

      expect(mockGalleryApi.getPost).toHaveBeenCalledWith(2);
    });
  });

  describe('useGalleryTags', () => {
    it('should initialize with default values', () => {
      // Arrange
      mockGalleryApi.getTags.mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useGalleryTags());

      // Assert
      expect(result.current.tags).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fetch tags on mount', async () => {
      // Arrange
      const mockTags = [
        { tag: 'family', count: 10 },
        { tag: 'memories', count: 8 },
        { tag: 'love', count: 5 }
      ];
      mockGalleryApi.getTags.mockResolvedValue(mockTags);

      // Act
      const { result } = renderHook(() => useGalleryTags());

      // Assert
      await waitFor(() => {
        expect(result.current.tags).toEqual(mockTags);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGalleryApi.getTags).toHaveBeenCalledTimes(1);
    });

    it('should handle tags fetch error', async () => {
      // Arrange
      const mockError = new Error('Tags fetch failed');
      mockGalleryApi.getTags.mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useGalleryTags());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Tags fetch failed');
      });

      expect(vi.mocked(console.error)).toHaveBeenCalledWith('Failed to fetch tags:', mockError);
    });

    it('should allow manual tags refresh', async () => {
      // Arrange
      mockGalleryApi.getTags.mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useGalleryTags());

      await waitFor(() => {
        expect(mockGalleryApi.getTags).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.fetchTags();
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getTags).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle empty tags array', async () => {
      // Arrange
      mockGalleryApi.getTags.mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useGalleryTags());

      // Assert
      await waitFor(() => {
        expect(result.current.tags).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largePosts = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Post ${i}`,
        file_type: 'image' as const,
        uploader_name: 'Test User',
        file_name: `test${i}.jpg`,
        original_file_name: `test${i}.jpg`,
        mime_type: 'image/jpeg',
        file_size: 1024,
        file_path: `/uploads/test${i}.jpg`,
        tags: [],
        is_public: true,
        status: 'approved' as const,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }));

      mockGalleryApi.getPosts.mockResolvedValue({
        posts: largePosts,
        pagination: {
          currentPage: 1,
          totalPages: 50,
          totalItems: 1000,
          itemsPerPage: 20,
          hasNextPage: true,
          hasPreviousPage: false
        }
      });

      // Act
      const startTime = performance.now();
      const { result } = renderHook(() => useGallery());

      await waitFor(() => {
        expect(result.current.posts).toHaveLength(1000);
      });
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(2000); // Should handle large datasets within 2 seconds
    });

    it('should complete operations within acceptable time limits', async () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPreviousPage: false }
      });

      // Act
      const startTime = performance.now();
      const { result } = renderHook(() => useGallery());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeouts', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockGalleryApi.getPosts.mockRejectedValue(timeoutError);

      // Act
      const { result } = renderHook(() => useGallery());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Network timeout');
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: undefined,
        pagination: null
      } as any);

      // Act
      const { result } = renderHook(() => useGallery());

      // Assert
      await waitFor(() => {
        expect(result.current.posts).toBeUndefined();
        expect(result.current.pagination).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle rapid state changes', async () => {
      // Arrange
      mockGalleryApi.getPosts.mockResolvedValue({
        posts: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPreviousPage: false }
      });

      // Act
      const { result } = renderHook(() => useGallery());

      // Simulate rapid state changes
      act(() => {
        result.current.fetchPosts({ page: 1 });
        result.current.fetchPosts({ page: 2 });
        result.current.fetchPosts({ page: 3 });
        result.current.refetch();
      });

      // Assert
      await waitFor(() => {
        expect(mockGalleryApi.getPosts).toHaveBeenCalledTimes(5); // Initial + 4 rapid calls
      });
    });
  });
});
