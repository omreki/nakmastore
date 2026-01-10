-- Create team_members table for managing store team
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'shop_manager', 'viewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read team members
CREATE POLICY "Allow authenticated users to read team members"
    ON team_members
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to insert team members
CREATE POLICY "Allow admins to insert team members"
    ON team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE email = auth.jwt()->>'email'
            AND role = 'admin'
        )
    );

-- Allow admins to update team members
CREATE POLICY "Allow admins to update team members"
    ON team_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE email = auth.jwt()->>'email'
            AND role = 'admin'
        )
    );

-- Allow admins to delete team members (except themselves)
CREATE POLICY "Allow admins to delete team members"
    ON team_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.email = auth.jwt()->>'email'
            AND tm.role = 'admin'
        )
        AND email != auth.jwt()->>'email'
    );

-- Create index for faster lookups
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_role ON team_members(role);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_members_updated_at();
