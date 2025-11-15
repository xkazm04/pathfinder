-- Migration: Add Projects feature
-- Description: Introduces Projects table to organize test suites by repository/project
-- Date: 2025-11-15

-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    repo TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project_id to test_suites table (optional foreign key)
ALTER TABLE test_suites
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for project_id in test_suites
CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);

-- Add trigger to update updated_at for projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for projects (allowing all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON projects
    FOR ALL USING (true);

-- Add comment for documentation
COMMENT ON TABLE projects IS 'Organizes test suites by project/repository';
COMMENT ON COLUMN test_suites.project_id IS 'Optional foreign key to associate test suite with a project';

-- Insert example project
INSERT INTO projects (name, repo, description)
VALUES (
    'Genesis',
    'https://github.com/xkazm04/pathfinder',
    'Let us make mankind in our image'
);
