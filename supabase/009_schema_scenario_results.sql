-- Migration: Scenario-Level Test Results
-- This migration extends the test results structure to support scenario-level tracking

-- Add scenario_id to test_results to link results with specific scenarios
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES test_scenarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_test_results_scenario_id ON test_results(scenario_id);

-- Create scenario_results table for detailed scenario execution tracking
CREATE TABLE IF NOT EXISTS scenario_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES test_scenarios(id) ON DELETE CASCADE,
    viewport VARCHAR(50) NOT NULL,
    viewport_size VARCHAR(50),
    status VARCHAR(50), -- pass, fail, skipped
    duration_ms INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    screenshots JSONB, -- array of screenshot URLs with metadata
    console_logs JSONB,
    errors JSONB,
    step_results JSONB, -- detailed results for each step
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Screenshot Analysis table
CREATE TABLE IF NOT EXISTS ai_screenshot_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_result_id UUID REFERENCES scenario_results(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    analysis_type VARCHAR(50) DEFAULT 'visual', -- visual, ui, accessibility
    findings JSONB, -- structured findings from AI
    issues JSONB, -- detected issues with severity
    suggestions TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    model_used VARCHAR(100), -- e.g., "gemini-pro-vision"
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenario_results_run_id ON scenario_results(run_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_scenario_id ON scenario_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_status ON scenario_results(status);
CREATE INDEX IF NOT EXISTS idx_ai_screenshot_analysis_scenario_result_id ON ai_screenshot_analysis(scenario_result_id);

-- Enable Row Level Security
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_screenshot_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON scenario_results
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON ai_screenshot_analysis
    FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE scenario_results IS 'Detailed test results for each scenario execution';
COMMENT ON TABLE ai_screenshot_analysis IS 'AI-powered analysis of test screenshots';
COMMENT ON COLUMN scenario_results.step_results IS 'JSON array of step-by-step execution results';
COMMENT ON COLUMN ai_screenshot_analysis.findings IS 'Structured findings: layout issues, broken elements, visual bugs';
COMMENT ON COLUMN ai_screenshot_analysis.issues IS 'Array of issues with {type, severity, description, location}';
