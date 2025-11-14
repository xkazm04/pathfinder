-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test Suites table
CREATE TABLE test_suites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test Runs table
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    config JSONB, -- viewport settings, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test Results table
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    viewport VARCHAR(50) NOT NULL, -- mobile, tablet, desktop
    viewport_size VARCHAR(50), -- e.g., "375x667"
    test_name VARCHAR(255),
    status VARCHAR(50), -- pass, fail, skipped
    duration_ms INTEGER,
    screenshots JSONB, -- array of screenshot URLs
    errors JSONB, -- array of error objects
    console_logs JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Analyses table
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50), -- visual, functional, accessibility
    findings JSONB, -- structured findings
    severity VARCHAR(50), -- critical, warning, info
    suggestions TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test Code Storage
CREATE TABLE test_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'typescript',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_test_runs_suite_id ON test_runs(suite_id);
CREATE INDEX idx_test_results_run_id ON test_results(run_id);
CREATE INDEX idx_ai_analyses_result_id ON ai_analyses(result_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
CREATE INDEX idx_test_code_suite_id ON test_code(suite_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at for test_suites
CREATE TRIGGER update_test_suites_updated_at
    BEFORE UPDATE ON test_suites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE test_suites IS 'Stores test suite configurations and metadata';
COMMENT ON TABLE test_runs IS 'Records of test execution runs';
COMMENT ON TABLE test_results IS 'Individual test results for each viewport';
COMMENT ON TABLE ai_analyses IS 'AI-generated analyses of test results';
COMMENT ON TABLE test_code IS 'Version-controlled test code storage';

-- Enable Row Level Security (RLS)
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_code ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust these based on your auth requirements)
-- For now, allowing all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON test_suites
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON test_runs
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON test_results
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON ai_analyses
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON test_code
    FOR ALL USING (true);
