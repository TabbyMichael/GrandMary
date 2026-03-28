-- Tribute Wall Schema for Supabase
-- Run this in your Supabase SQL Editor after the gallery schema

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tribute posts table
CREATE TABLE IF NOT EXISTS tributes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_name TEXT NOT NULL,
    author_relationship TEXT,
    author_email TEXT,
    author_ip TEXT,
    message TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tribute reactions table
CREATE TABLE IF NOT EXISTS tribute_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tribute_id UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'like', 'pray', 'smile')),
    reactor_name TEXT NOT NULL,
    reactor_email TEXT,
    reactor_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tribute_id, reactor_name, reactor_ip)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tribute_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_tributes_updated_at 
    BEFORE UPDATE ON tributes 
    FOR EACH ROW EXECUTE FUNCTION update_tribute_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tributes_status ON tributes(status);
CREATE INDEX IF NOT EXISTS idx_tributes_created_at ON tributes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tributes_is_public ON tributes(is_public);
CREATE INDEX IF NOT EXISTS idx_tribute_reactions_tribute_id ON tribute_reactions(tribute_id);

-- Row Level Security (RLS) Policies
ALTER TABLE tributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribute_reactions ENABLE ROW LEVEL SECURITY;

-- Policy for tributes - everyone can read approved public tributes
CREATE POLICY "Approved tributes are viewable by everyone"
    ON tributes FOR SELECT
    USING (status = 'approved' AND is_public = true);

-- Policy for tributes - anyone can insert (for new tributes)
CREATE POLICY "Anyone can insert tributes"
    ON tributes FOR INSERT
    WITH CHECK (true);

-- Policy for tribute reactions - anyone can react to approved tributes
CREATE POLICY "Anyone can react to approved tributes"
    ON tribute_reactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tributes 
            WHERE tributes.id = tribute_reactions.tribute_id 
            AND tributes.status = 'approved' 
            AND tributes.is_public = true
        )
    );
