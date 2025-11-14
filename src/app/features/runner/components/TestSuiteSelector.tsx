'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { getTestSuites } from '@/lib/supabase/testSuites';
import { TestSuite } from '@/lib/types';
import { FileCode, Search, ExternalLink, Calendar } from 'lucide-react';

interface TestSuiteSelectorProps {
  selectedSuite: TestSuite | null;
  onSelectSuite: (suite: TestSuite | null) => void;
}

export function TestSuiteSelector({ selectedSuite, onSelectSuite }: TestSuiteSelectorProps) {
  const { currentTheme } = useTheme();
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = async () => {
    try {
      setLoading(true);
      const data = await getTestSuites();
      setSuites(data);
    } catch (error) {
      console.error('Failed to load test suites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuites = suites.filter(suite =>
    suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suite.target_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Test Suite Selection"
        subtitle={`${suites.length} suite${suites.length !== 1 ? 's' : ''} available`}
        icon={<FileCode className="w-5 h-5" />}
      />
      <ThemedCardContent>
        {/* Search */}
        <div className="mt-4 mb-4 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: currentTheme.colors.text.tertiary }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test suites..."
            className="w-full pl-10 pr-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
          />
        </div>

        {/* Suite List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
              Loading test suites...
            </div>
          ) : filteredSuites.length === 0 ? (
            <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
              {searchQuery ? 'No matching test suites found' : 'No test suites available'}
            </div>
          ) : (
            filteredSuites.map((suite, index) => (
              <motion.button
                key={suite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                onClick={() => onSelectSuite(selectedSuite?.id === suite.id ? null : suite)}
                className="w-full text-left p-4 rounded-lg transition-all"
                style={{
                  backgroundColor:
                    selectedSuite?.id === suite.id
                      ? `${currentTheme.colors.primary}15`
                      : currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor:
                    selectedSuite?.id === suite.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.border,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm" style={{ color: currentTheme.colors.text.primary }}>
                    {suite.name}
                  </h4>
                  {selectedSuite?.id === suite.id && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    />
                  )}
                </div>

                {suite.description && (
                  <p className="text-xs mb-2 line-clamp-2" style={{ color: currentTheme.colors.text.secondary }}>
                    {suite.description}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{suite.target_url}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(suite.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
