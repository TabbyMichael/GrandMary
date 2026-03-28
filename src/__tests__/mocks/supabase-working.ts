import { vi } from 'vitest';

// Create a working Supabase mock
const createWorkingSupabaseMock = () => {
  const mockData = {
    gallery_posts: [],
    tributes: [],
    gallery_reactions: [],
    gallery_comments: [],
    tribute_reactions: []
  };

  // Create a proper query builder mock
  const createQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => 
      callback({ data: [], error: null })
    )
  });

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ 
        data: { path: 'test-path.jpg' }, 
        error: null 
      }),
      getPublicUrl: vi.fn().mockReturnValue({ 
        data: { publicUrl: 'https://test-url.jpg' } 
      })
    })
  };

  const mockClient = {
    from: vi.fn(() => createQueryBuilder()),
    storage: mockStorage,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null })
  };

  return mockClient;
};

// Create working service mocks
const mockGalleryService = {
  getPosts: vi.fn().mockResolvedValue({
    posts: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPreviousPage: false
    }
  }),
  getPost: vi.fn().mockResolvedValue({
    post: null,
    reactions: [],
    comments: []
  }),
  uploadPost: vi.fn().mockResolvedValue({
    id: 1,
    title: 'Test Post',
    status: 'pending'
  }),
  addReaction: vi.fn().mockResolvedValue({ id: 1 }),
  addComment: vi.fn().mockResolvedValue({ id: 1 }),
  getStats: vi.fn().mockResolvedValue({
    total_posts: 0,
    total_images: 0,
    total_videos: 0,
    approved_posts: 0,
    pending_posts: 0
  }),
  getTags: vi.fn().mockResolvedValue([]),
  uploadFile: vi.fn().mockResolvedValue('test-path.jpg')
};

const mockTributeService = {
  getTributes: vi.fn().mockResolvedValue([]),
  addTribute: vi.fn().mockResolvedValue({
    id: '1',
    author_name: 'Test User',
    message: 'Test tribute',
    status: 'pending'
  }),
  addReaction: vi.fn().mockResolvedValue({ id: 1 }),
  getTributeStats: vi.fn().mockResolvedValue({
    total_tributes: 0,
    total_reactions: 0
  })
};

// Mock the modules
vi.mock('@/lib/supabase-client', () => ({
  supabase: createWorkingSupabaseMock(),
  galleryService: mockGalleryService
}));

vi.mock('@/lib/tribute-supabase', () => ({
  tributeService: mockTributeService
}));

// Export for use in tests
export { mockGalleryService, mockTributeService };
