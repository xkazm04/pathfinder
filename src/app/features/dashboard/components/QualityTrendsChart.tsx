'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { QualityTrendPoint, IssuesByCategory } from '@/lib/supabase/dashboard';

interface QualityTrendsChartProps {
  trends: QualityTrendPoint[];
  issuesByCategory: IssuesByCategory[];
}

export function QualityTrendsChart({ trends, issuesByCategory }: QualityTrendsChartProps) {
  const { currentTheme } = useTheme();

  // Calculate min and max for scaling
  const qualityScores = trends.map(t => t.quality_score);
  const minScore = Math.min(...qualityScores, 0);
  const maxScore = Math.max(...qualityScores, 100);
  const scoreRange = maxScore - minScore || 1;

  // Group trends by date (in case multiple runs on same day)
  const trendsByDate = trends.reduce((acc, trend) => {
    const date = trend.date;
    if (!acc[date] || new Date(trend.date) > new Date(acc[date].date)) {
      acc[date] = trend;
    }
    return acc;
  }, {} as Record<string, QualityTrendPoint>);

  const consolidatedTrends = Object.values(trendsByDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get top 3 issue categories
  const topCategories = issuesByCategory.slice(0, 3);

  const getQualityColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      visual: '#3b82f6',
      functional: '#8b5cf6',
      responsive: '#06b6d4',
      accessibility: '#f59e0b',
      content: '#ec4899',
    };
    return colors[category] || currentTheme.colors.accent;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quality Trend Chart */}
      <div className="lg:col-span-2">
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Quality Score Trend"
            subtitle="Last 30 days"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <div className="mt-6">
              {consolidatedTrends.length === 0 ? (
                <div className="text-center py-12" style={{ color: currentTheme.colors.text.tertiary }}>
                  No quality trend data available yet
                </div>
              ) : (
                <div className="relative h-64">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                    <span>0</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-8 h-full flex items-end gap-1">
                    {consolidatedTrends.map((trend, index) => {
                      const height = ((trend.quality_score - minScore) / scoreRange) * 100;
                      const color = getQualityColor(trend.quality_score);
                      const date = new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div key={trend.test_run_id} className="flex-1 flex flex-col items-center group">
                          {/* Bar */}
                          <div className="relative w-full flex items-end justify-center" style={{ height: '220px' }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="w-full rounded-t transition-opacity hover:opacity-80 cursor-pointer"
                              style={{
                                backgroundColor: color,
                                minHeight: '4px',
                              }}
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div
                                  className="px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap"
                                  style={{
                                    backgroundColor: currentTheme.colors.surface,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: currentTheme.colors.border,
                                  }}
                                >
                                  <div className="font-semibold mb-1" style={{ color: currentTheme.colors.text.primary }}>
                                    {date}
                                  </div>
                                  <div style={{ color }}>
                                    Quality: {trend.quality_score}
                                  </div>
                                  <div style={{ color: currentTheme.colors.text.secondary }}>
                                    Pass Rate: {trend.pass_rate.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>

                          {/* Date label */}
                          <div className="mt-2 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                            {date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Issues by Category */}
      <div>
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Top Issues"
            subtitle="By category"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <div className="mt-4 space-y-4">
              {topCategories.length === 0 ? (
                <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
                  No issues found
                </div>
              ) : (
                topCategories.map((category, index) => {
                  const categoryColor = getCategoryColor(category.category);
                  const totalIssues = issuesByCategory.reduce((sum, c) => sum + c.count, 0);
                  const percentage = totalIssues > 0 ? (category.count / totalIssues) * 100 : 0;

                  return (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Category header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="text-sm font-medium capitalize" style={{ color: currentTheme.colors.text.primary }}>
                            {category.category}
                          </span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                          {category.count}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                      </div>

                      {/* Severity breakdown */}
                      <div className="mt-1 flex gap-3 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                        <span>
                          <span style={{ color: '#ef4444' }}>{category.critical}</span> critical
                        </span>
                        <span>
                          <span style={{ color: '#f97316' }}>{category.warning}</span> warning
                        </span>
                        <span>
                          <span style={{ color: currentTheme.colors.accent }}>{category.info}</span> info
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
}
