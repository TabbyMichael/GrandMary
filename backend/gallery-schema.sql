-- Memorial Gallery Database Schema
-- PostgreSQL implementation for Mary Mathenge Memorial Gallery

-- Gallery posts table
CREATE TABLE IF NOT EXISTS gallery_posts (
    id SERIAL PRIMARY KEY,
    uploader_name VARCHAR(255) NOT NULL,
    uploader_email VARCHAR(255),
    uploader_ip INET,
    title VARCHAR(500),
    caption TEXT,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- 'image' or 'video'
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    file_path VARCHAR(1000) NOT NULL,
    thumbnail_path VARCHAR(1000),
    tags TEXT[], -- PostgreSQL array for tags like ["Birthday", "Memories"]
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_date DATE, -- Optional date of the memory/event
    location VARCHAR(255) -- Optional location where photo/video was taken
);

-- Reactions table (likes, hearts, etc.)
CREATE TABLE IF NOT EXISTS gallery_reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'heart', 'like', 'love', etc.
    reactor_name VARCHAR(255) NOT NULL,
    reactor_email VARCHAR(255),
    reactor_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, reactor_name, reactor_ip) -- Prevent duplicate reactions
);

-- Comments table
CREATE TABLE IF NOT EXISTS gallery_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    commenter_name VARCHAR(255) NOT NULL,
    commenter_email VARCHAR(255),
    commenter_ip INET,
    comment_text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gallery views tracking (for analytics)
CREATE TABLE IF NOT EXISTS gallery_views (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    viewer_ip INET,
    viewer_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS gallery_reports (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_email VARCHAR(255),
    reporter_ip INET,
    reason VARCHAR(100) NOT NULL, -- 'inappropriate', 'spam', 'copyright', etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
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

-- View for gallery statistics
CREATE OR REPLACE VIEW gallery_stats AS
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN file_type = 'image' THEN 1 END) as total_images,
    COUNT(CASE WHEN file_type = 'video' THEN 1 END) as total_videos,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_posts,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_posts,
    COUNT(DISTINCT uploader_ip) as unique_uploaders,
    SUM(file_size) as total_storage_used,
    AVG(file_size) as average_file_size
FROM gallery_posts;

-- View for popular posts (by reactions)
CREATE OR REPLACE VIEW popular_gallery_posts AS
SELECT 
    gp.*,
    COUNT(gr.id) as reaction_count,
    COUNT(gc.id) as comment_count,
    COUNT(gv.id) as view_count
FROM gallery_posts gp
LEFT JOIN gallery_reactions gr ON gp.id = gr.post_id
LEFT JOIN gallery_comments gc ON gp.id = gc.post_id AND gc.is_approved = true
LEFT JOIN gallery_views gv ON gp.id = gv.post_id
WHERE gp.status = 'approved' AND gp.is_public = true
GROUP BY gp.id
ORDER BY reaction_count DESC, comment_count DESC, view_count DESC;
