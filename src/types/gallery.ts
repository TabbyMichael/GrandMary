// Gallery types for Supabase integration
export interface GalleryPost {
  id: string;
  uploader_name: string;
  uploader_relationship?: string;
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
}

export interface GalleryReaction {
  id: string;
  post_id: string;
  reaction_type: string;
  reactor_name: string;
  reactor_email?: string;
  reactor_ip?: string;
  created_at: string;
}

export interface GalleryComment {
  id: string;
  post_id: string;
  commenter_name: string;
  commenter_email?: string;
  commenter_ip?: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryStats {
  total_posts: number;
  total_images: number;
  total_videos: number;
  approved_posts: number;
  pending_posts: number;
  unique_uploaders: number;
  total_storage_used: number | null;
  average_file_size: number | null;
}

export interface GalleryTag {
  tag: string;
  count: number;
}
