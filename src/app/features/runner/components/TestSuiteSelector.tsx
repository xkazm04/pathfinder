'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { getTestSuites } from '@/lib/supabase/testSuites';
import { getTestScenarios } from '@/lib/supabase/suiteAssets';
import { TestSuite } from '@/lib/types';
import { FileCode, Search } from 'lucide-react';
import { TestSuiteItem } from './TestSuiteItem';

interface TestSuiteSelectorProps {
  selectedSuite: TestSuite | null;
  onSelectSuite: (suite: TestSuite | null) => void;
}

interface SuiteWithScenarioCount extends TestSuite {
  scenarioCount: number;
}

export function TestSuiteSelector({ selectedSuite, onSelectSuite }: TestSuiteSelectorProps) {
  const { currentTheme } = useTheme();
  const [suites, setSuites] = useState<SuiteWithScenarioCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = async () => {
    try {
      setLoading(true);
      const data = await getTestSuites();

      // Load scenario counts for each suite
      const suitesWithCounts = await Promise.all(
        data.map(async (suite) => {
          const scenarios = await getTestScenarios(suite.id);
          return {
            ...suite,
            scenarioCount: scenarios.length,
          };
        })
      );

      setSuites(suitesWithCounts);
    } catch (error) {
      // Failed to load test suites - silently fail
    } finally {
      setLoading(false);
    }
  };

  const filteredSuites = suites.filter(suite =>
    suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suite.target_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
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
            data-testid="test-suite-search-input"
          />
        </div>

        {/* Suite List */}
        <div className="space-y-2 max-h-[90vh] overflow-y-hidden">
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
              <TestSuiteItem
                key={suite.id}
                suite={suite}
                isSelected={selectedSuite?.id === suite.id}
                onClick={() => onSelectSuite(selectedSuite?.id === suite.id ? null : suite)}
                theme={currentTheme}
                index={index}
              />
            ))
          )}
        </div>
      </ThemedCardContent>
    </div>
  );
}
