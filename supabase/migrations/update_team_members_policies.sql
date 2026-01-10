-- Update RLS policies for team_members table to allow admin access from profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read team members" ON team_members;
DROP POLICY IF EXISTS "Allow admins to insert team members" ON team_members;
DROP POLICY IF EXISTS "Allow admins to update team members" ON team_members;
DROP POLICY IF EXISTS "Allow admins to delete team members" ON team_members;

-- Allow all authenticated users to read team members
CREATE POLICY "Allow authenticated users to read team members"
    ON team_members
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins from profiles table or team_members to insert
CREATE POLICY "Allow admins to insert team members"
    ON team_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Check if user is admin in profiles table
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
        OR
        -- Check if user is admin in team_members table
        EXISTS (
            SELECT 1 FROM team_members
            WHERE email = auth.jwt()->>'email'
            AND role = 'admin'
        )
    );

-- Allow admins to update team_members
CREATE POLICY "Allow admins to update team members"
    ON team_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
        OR
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
        (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = 'admin'
            )
            OR
            EXISTS (
                SELECT 1 FROM team_members tm
                WHERE tm.email = auth.jwt()->>'email'
                AND tm.role = 'admin'
            )
        )
        AND email != auth.jwt()->>'email'
    );
