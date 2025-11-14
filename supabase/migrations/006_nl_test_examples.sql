-- Natural Language Test Examples table for learning and improvement
CREATE TABLE IF NOT EXISTS nl_test_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nl_description TEXT NOT NULL,
    generated_code TEXT NOT NULL,
    final_code TEXT, -- After user edits
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    target_url TEXT,
    viewport VARCHAR(50),
    test_type VARCHAR(50), -- functional, visual, accessibility, performance
    suite_id UUID REFERENCES test_suites(id) ON DELETE SET NULL,
    metadata JSONB, -- Additional context like steps, selectors, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nl_examples_target_url ON nl_test_examples(target_url);
CREATE INDEX IF NOT EXISTS idx_nl_examples_test_type ON nl_test_examples(test_type);
CREATE INDEX IF NOT EXISTS idx_nl_examples_suite_id ON nl_test_examples(suite_id);
CREATE INDEX IF NOT EXISTS idx_nl_examples_created_at ON nl_test_examples(created_at);

-- Full text search index on NL descriptions
CREATE INDEX IF NOT EXISTS idx_nl_examples_description_search
    ON nl_test_examples USING gin(to_tsvector('english', nl_description));

-- Create trigger for updated_at
CREATE TRIGGER update_nl_examples_updated_at
    BEFORE UPDATE ON nl_test_examples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
