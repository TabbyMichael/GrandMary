-- Supabase SQL Schema for Everbloom Memorial Gallery
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Gallery posts table
CREATE TABLE IF NOT EXISTS gallery_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    uploader_name TEXT NOT NULL,
    uploader_relationship TEXT,
    uploader_ip TEXT,
    title TEXT,
    caption TEXT,
    file_name TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    tags TEXT[], -- PostgreSQL array for tags
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_date DATE,
    location TEXT
);

-- Reactions table
CREATE TABLE IF NOT EXISTS gallery_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    reactor_name TEXT NOT NULL,
    reactor_email TEXT,
    reactor_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, reactor_name, reactor_ip)
);

-- Comments table
CREATE TABLE IF NOT EXISTS gallery_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    commenter_name TEXT NOT NULL,
    commenter_email TEXT,
    commenter_ip TEXT,
    comment_text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gallery views tracking
CREATE TABLE IF NOT EXISTS gallery_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    viewer_ip TEXT,
    viewer_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS gallery_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT,
    reporter_ip TEXT,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_posts_status ON gallery_posts(status);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_file_type ON gallery_posts(file_type);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_public ON gallery_posts(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_reactions_post_id ON gallery_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_post_id ON gallery_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_is_approved ON gallery_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_gallery_views_post_id ON gallery_views(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_reports_post_id ON gallery_reports(post_id);

-- GIN index for tags array (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_gallery_posts_tags ON gallery_posts USING GIN(tags);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_gallery_posts_updated_at 
    BEFORE UPDATE ON gallery_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_comments_updated_at 
    BEFORE UPDATE ON gallery_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_reports ENABLE ROW LEVEL SECURITY;

-- Policy for gallery posts - everyone can read approved public posts
CREATE POLICY "Public posts are viewable by everyone"
    ON gallery_posts FOR SELECT
    USING (status = 'approved' AND is_public = true);

-- Policy for gallery posts - anyone can insert (for uploads)
CREATE POLICY "Anyone can insert posts"
    ON gallery_posts FOR INSERT
    WITH CHECK (true);

-- Policy for reactions - anyone can react to approved posts
CREATE POLICY "Anyone can react to approved posts"
    ON gallery_reactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gallery_posts 
            WHERE gallery_posts.id = gallery_reactions.post_id 
            AND gallery_posts.status = 'approved' 
            AND gallery_posts.is_public = true
        )
    );

-- Policy for comments - anyone can comment on approved posts
CREATE POLICY "Anyone can comment on approved posts"
    ON gallery_comments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gallery_posts 
            WHERE gallery_posts.id = gallery_comments.post_id 
            AND gallery_posts.status = 'approved' 
            AND gallery_posts.is_public = true
        )
    );

-- Policy for views - anyone can view approved posts
CREATE POLICY "Anyone can view approved posts"
    ON gallery_views FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM gallery_posts 
            WHERE gallery_posts.id = gallery_views.post_id 
            AND gallery_posts.status = 'approved' 
            AND gallery_posts.is_public = true
        )
    );

-- Policy for reports - anyone can report approved posts
CREATE POLICY "Anyone can report approved posts"
    ON gallery_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM gallery_posts 
            WHERE gallery_posts.id = gallery_reports.post_id 
            AND gallery_posts.status = 'approved' 
            AND gallery_posts.is_public = true
        )
    );

-- Storage bucket for gallery files
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage - anyone can upload to gallery bucket
CREATE POLICY "Anyone can upload to gallery bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'gallery');

-- Policy for storage - anyone can view gallery bucket files
CREATE POLICY "Anyone can view gallery bucket files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'gallery');

-- Sample data (optional - you can remove this)
INSERT INTO gallery_posts (
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
    tags, 
    is_public, 
    status,
    event_date,
    location
) VALUES 
(
    'Sarah Johnson',
    'Granddaughter',
    'Family Reunion 2020',
    'A wonderful day spent together as a family. Mary was so happy to see everyone together.',
    'family-reunion-2020.jpg',
    'IMG_20200715_143022.jpg',
    'image',
    'image/jpeg',
    2048000,
    'gallery/family-reunion-2020.jpg',
    ARRAY['Family', 'Reunion', 'Memories'],
    true,
    'approved',
    '2020-07-15',
    'Nairobi, Kenya'
),
(
    'Michael Wangui',
    'Son',
    'Birthday Celebration',
    'Celebrating mom''s 75th birthday with all her favorite things.',
    'birthday-celebration.jpg',
    'IMG_20231210_164500.jpg',
    'image',
    'image/jpeg',
    1536000,
    'gallery/birthday-celebration.jpg',
    ARRAY['Birthday', 'Celebration', 'Family'],
    true,
    'approved',
    '2023-12-10',
    'Home'
),
(
    'Grace Kariuki',
    'Friend',
    'Garden Memories',
    'Mary in her element - tending to her beautiful garden. She loved her flowers so much.',
    'garden-memories.jpg',
    'IMG_20230620_091500.jpg',
    'image',
    'image/jpeg',
    3072000,
    'gallery/garden-memories.jpg',
    ARRAY['Garden', 'Nature', 'Memories'],
    true,
    'approved',
    '2023-06-20',
    'Home Garden'
);

-- Sample reactions
INSERT INTO gallery_reactions (post_id, reaction_type, reactor_name, reactor_ip)
SELECT 
    id, 
    'heart', 
    CASE WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Family Reunion 2020') THEN 'John Doe'
         WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Birthday Celebration') THEN 'Jane Smith'
         ELSE 'Bob Johnson' END,
    '127.0.0.1'
FROM gallery_posts 
WHERE status = 'approved' 
LIMIT 3;

-- Sample comments
INSERT INTO gallery_comments (post_id, commenter_name, comment_text, is_approved, commenter_ip)
SELECT 
    id, 
    CASE WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Family Reunion 2020') THEN 'Emily Chen'
         WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Birthday Celebration') THEN 'Grace Lee'
         ELSE 'Henry Taylor' END,
    CASE WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Family Reunion 2020') THEN 'Such beautiful memories! ❤️'
         WHEN id = (SELECT id FROM gallery_posts WHERE title = 'Birthday Celebration') THEN 'Happy birthday to the best mom!'
         ELSE 'Mary had such a green thumb!' END,
    true,
    '127.0.0.1'
FROM gallery_posts 
WHERE status = 'approved' 
LIMIT 3;
