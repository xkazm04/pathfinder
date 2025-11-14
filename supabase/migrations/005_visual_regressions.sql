-- Add baseline tracking to test_suites table
ALTER TABLE test_suites
ADD COLUMN IF NOT EXISTS baseline_run_id UUID REFERENCES test_runs(id),
ADD COLUMN IF NOT EXISTS baseline_set_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS baseline_notes TEXT;

-- Create visual_regressions table
CREATE TABLE IF NOT EXISTS visual_regressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    baseline_run_id UUID REFERENCES test_runs(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    viewport VARCHAR(50) NOT NULL,
    step_name VARCHAR(255),
    baseline_screenshot_url TEXT,
    current_screenshot_url TEXT,
    diff_screenshot_url TEXT,
    pixels_different INTEGER,
    percentage_different DECIMAL(5,2),
    dimensions_width INTEGER,
    dimensions_height INTEGER,
    threshold DECIMAL(3,2) DEFAULT 0.10,
    is_significant BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, bug_reported, investigating, false_positive
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    notes TEXT,
    ai_analysis JSONB, -- Store AI analysis results
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regressions_run_id ON visual_regressions(test_run_id);
CREATE INDEX IF NOT EXISTS idx_regressions_baseline_run_id ON visual_regressions(baseline_run_id);
CREATE INDEX IF NOT EXISTS idx_regressions_status ON visual_regressions(status);
CREATE INDEX IF NOT EXISTS idx_regressions_significant ON visual_regressions(is_significant);
CREATE INDEX IF NOT EXISTS idx_regressions_test_viewport ON visual_regressions(test_name, viewport);

-- Create ignore_regions table for excluding dynamic content
CREATE TABLE IF NOT EXISTS ignore_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    test_name VARCHAR(255),
    viewport VARCHAR(50),
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ignore_regions_suite ON ignore_regions(suite_id);
CREATE INDEX IF NOT EXISTS idx_ignore_regions_test_viewport ON ignore_regions(test_name, viewport);

-- Create diff_thresholds table for custom thresholds
CREATE TABLE IF NOT EXISTS diff_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    viewport VARCHAR(50),
    threshold DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(suite_id, viewport)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for visual_regressions
CREATE TRIGGER update_visual_regressions_updated_at
    BEFORE UPDATE ON visual_regressions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for diff_thresholds
CREATE TRIGGER update_diff_thresholds_updated_at
    BEFORE UPDATE ON diff_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
