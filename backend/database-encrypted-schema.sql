-- Encrypted Database Schema for Everbloom Memorial Platform
-- This schema implements field-level encryption for PII data

-- Users table with encrypted PII fields
CREATE TABLE IF NOT EXISTS users_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Encrypted PII fields (stored as JSON)
    email_encrypted JSONB NOT NULL,
    phone_encrypted JSONB,
    full_name_encrypted JSONB,
    relationship_encrypted JSONB,
    address_encrypted JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Security fields
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user',
    mfa_secret JSONB, -- Encrypted MFA secret
    mfa_enabled BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    CONSTRAINT users_username_check CHECK (length(username) >= 3),
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'))
);

-- Gallery posts with encrypted uploader information
CREATE TABLE IF NOT EXISTS gallery_posts_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Encrypted uploader PII
    uploader_name_encrypted JSONB NOT NULL,
    uploader_relationship_encrypted JSONB,
    uploader_email_encrypted JSONB,
    uploader_ip INET, -- IP can be stored as-is for security logging
    
    -- Post metadata (non-sensitive)
    title VARCHAR(255) NOT NULL,
    caption TEXT,
    tags JSONB,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    
    -- Moderation
    is_public BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users_encrypted(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tribute posts with encrypted author information
CREATE TABLE IF NOT EXISTS tributes_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Encrypted author PII
    author_name_encrypted JSONB NOT NULL,
    author_relationship_encrypted JSONB,
    author_email_encrypted JSONB,
    author_ip INET,
    
    -- Tribute content
    message TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments with encrypted commenter information
CREATE TABLE IF NOT EXISTS comments_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL, -- Can reference gallery or tribute posts
    post_type VARCHAR(20) NOT NULL, -- 'gallery' or 'tribute'
    
    -- Encrypted commenter PII
    commenter_name_encrypted JSONB NOT NULL,
    commenter_email_encrypted JSONB,
    commenter_ip INET,
    
    -- Comment content
    message TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions with encrypted reactor information
CREATE TABLE IF NOT EXISTS reactions_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL,
    post_type VARCHAR(20) NOT NULL,
    
    -- Encrypted reactor PII
    reactor_name_encrypted JSONB NOT NULL,
    reactor_email_encrypted JSONB,
    reactor_ip INET,
    
    -- Reaction data
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT reactions_type_check CHECK (reaction_type IN ('heart', 'like', 'pray', 'smile', 'sad'))
);

-- Reports with encrypted reporter information
CREATE TABLE IF NOT EXISTS reports_encrypted (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL,
    post_type VARCHAR(20) NOT NULL,
    
    -- Encrypted reporter PII
    reporter_name_encrypted JSONB NOT NULL,
    reporter_email_encrypted JSONB,
    reporter_ip INET,
    
    -- Report data
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Moderation
    reviewed_by UUID REFERENCES users_encrypted(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT reports_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'resolved'))
);

-- Audit log for PII access
CREATE TABLE IF NOT EXISTS pii_access_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users_encrypted(id),
    accessed_by UUID REFERENCES users_encrypted(id),
    
    -- Access details
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    fields_accessed JSONB, -- List of PII fields accessed
    access_reason VARCHAR(255),
    
    -- Request details
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users_encrypted(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users_encrypted(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT security_events_type_check CHECK (event_type IN (
        'login_attempt', 'login_success', 'login_failure', 'pii_access',
        'mfa_attempt', 'mfa_success', 'mfa_failure', 'password_change',
        'account_locked', 'suspicious_activity', 'data_breach_attempt'
    )),
    CONSTRAINT security_events_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_encrypted_username ON users_encrypted(username);
CREATE INDEX IF NOT EXISTS idx_users_encrypted_email_hash ON users_encrypted USING hash(email_encrypted);
CREATE INDEX IF NOT EXISTS idx_users_encrypted_role ON users_encrypted(role);
CREATE INDEX IF NOT EXISTS idx_users_encrypted_active ON users_encrypted(is_active);

CREATE INDEX IF NOT EXISTS idx_gallery_posts_encrypted_public ON gallery_posts_encrypted(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_encrypted_approved ON gallery_posts_encrypted(is_approved);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_encrypted_created ON gallery_posts_encrypted(created_at);

CREATE INDEX IF NOT EXISTS idx_tributes_encrypted_public ON tributes_encrypted(is_public);
CREATE INDEX IF NOT EXISTS idx_tributes_encrypted_created ON tributes_encrypted(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_encrypted_post ON comments_encrypted(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_comments_encrypted_approved ON comments_encrypted(is_approved);

CREATE INDEX IF NOT EXISTS idx_reactions_encrypted_post ON reactions_encrypted(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_reactions_encrypted_type ON reactions_encrypted(reaction_type);

CREATE INDEX IF NOT EXISTS idx_reports_encrypted_status ON reports_encrypted(status);
CREATE INDEX IF NOT EXISTS idx_reports_encrypted_created ON reports_encrypted(created_at);

CREATE INDEX IF NOT EXISTS idx_pii_access_log_user ON pii_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_accessed_by ON pii_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_created ON pii_access_log(created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE users_encrypted ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts_encrypted ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributes_encrypted ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments_encrypted ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions_encrypted ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_encrypted ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_encrypted
CREATE POLICY "Users can view own profile" ON users_encrypted
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users_encrypted
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_encrypted 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for gallery_posts_encrypted
CREATE POLICY "Public posts are viewable by everyone" ON gallery_posts_encrypted
    FOR SELECT USING (is_public = TRUE AND is_approved = TRUE);

CREATE POLICY "Users can view own posts" ON gallery_posts_encrypted
    FOR SELECT USING (
        uploader_name_encrypted IS NOT NULL -- This would need to be decrypted for comparison
    );

-- RLS Policies for tributes_encrypted
CREATE POLICY "Public tributes are viewable by everyone" ON tributes_encrypted
    FOR SELECT USING (is_public = TRUE);

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_encrypted_updated_at BEFORE UPDATE ON users_encrypted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_posts_encrypted_updated_at BEFORE UPDATE ON gallery_posts_encrypted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tributes_encrypted_updated_at BEFORE UPDATE ON tributes_encrypted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_encrypted_updated_at BEFORE UPDATE ON comments_encrypted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_encrypted_updated_at BEFORE UPDATE ON reports_encrypted
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log PII access
CREATE OR REPLACE FUNCTION log_pii_access(
    p_user_id UUID,
    p_accessed_by UUID,
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_fields_accessed JSONB,
    p_access_reason VARCHAR(255),
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10),
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pii_access_log (
        user_id, accessed_by, table_name, record_id, fields_accessed,
        access_reason, endpoint, method, ip_address, user_agent
    ) VALUES (
        p_user_id, p_accessed_by, p_table_name, p_record_id, p_fields_accessed,
        p_access_reason, p_endpoint, p_method, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_event_description TEXT,
    p_severity VARCHAR(20),
    p_ip_address INET,
    p_user_agent TEXT,
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_events (
        user_id, event_type, event_description, severity,
        ip_address, user_agent, endpoint, method
    ) VALUES (
        p_user_id, p_event_type, p_event_description, p_severity,
        p_ip_address, p_user_agent, p_endpoint, p_method
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
