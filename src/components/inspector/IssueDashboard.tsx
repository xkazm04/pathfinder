'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Finding } from '@/lib/supabase/aiAnalyses';
import { FindingCard } from './FindingCard';
import { AlertCircle, TrendingUp, Filter } from 'lucide-react';

interface IssueDashboardProps {
  findings: Finding[];
  qualityScore: number;
}

export function IssueDashboard({ findings, qualityScore }: IssueDashboardProps) {
  const { currentTheme } = useTheme();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'confidence' | 'category'>('severity');

  // Calculate statistics
  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    warning: findings.filter(f => f.severity === 'warning').length,
    info: findings.filter(f => f.severity === 'info').length,
    byCategory: {
      visual: findings.filter(f => f.category === 'visual').length,
      functional: findings.filter(f => f.category === 'functional').length,
      responsive: findings.filter(f => f.category === 'responsive').length,
      accessibility: findings.filter(f => f.category === 'accessibility').length,
      content: findings.filter(f => f.category === 'content').length,
    },
  };

  const mostCommonCategory = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])[0];

  // Filter and sort findings
  const filteredFindings = findings
    .filter(f => filterSeverity === 'all' || f.severity === filterSeverity)
    .filter(f => filterCategory === 'all' || f.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      } else if (sortBy === 'confidence') {
        return b.confidenceScore - a.confidenceScore;
      } else {
        return a.category.localeCompare(b.category);
      }
    });

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ThemedCard variant="bordered">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
                <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                  Total Issues
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
                {stats.total}
              </div>
            </div>
          </ThemedCard>
        </motion.div>

        {/* Critical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <ThemedCard variant="bordered">
            <div className="p-4">
              <div className="text-xs font-medium mb-2" style={{ color: '#ef4444' }}>
                Critical
              </div>
              <div className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                {stats.critical}
              </div>
            </div>
          </ThemedCard>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ThemedCard variant="bordered">
            <div className="p-4">
              <div className="text-xs font-medium mb-2" style={{ color: '#f97316' }}>
                Warning
              </div>
              <div className="text-3xl font-bold" style={{ color: '#f97316' }}>
                {stats.warning}
              </div>
            </div>
          </ThemedCard>
        </motion.div>

        {/* Quality Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <ThemedCard variant="bordered">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: getQualityScoreColor(qualityScore) }} />
                <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                  Quality Score
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: getQualityScoreColor(qualityScore) }}>
                {qualityScore}
              </div>
            </div>
          </ThemedCard>
        </motion.div>
      </div>

      {/* Most Common Category */}
      {mostCommonCategory && mostCommonCategory[1] > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg"
          style={{
            backgroundColor: `${currentTheme.colors.accent}10`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: `${currentTheme.colors.accent}30`,
          }}
        >
          <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
            Most common category: <span className="font-semibold" style={{ color: currentTheme.colors.text.primary }}>
              {mostCommonCategory[0].charAt(0).toUpperCase() + mostCommonCategory[0].slice(1)}
            </span> ({mostCommonCategory[1]} issue{mostCommonCategory[1] > 1 ? 's' : ''})
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Filters & Sort"
          icon={<Filter className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Severity Filter */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: currentTheme.colors.text.tertiary }}>
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text.primary,
                }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: currentTheme.colors.text.tertiary }}>
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text.primary,
                }}
              >
                <option value="all">All Categories</option>
                <option value="visual">Visual</option>
                <option value="functional">Functional</option>
                <option value="responsive">Responsive</option>
                <option value="accessibility">Accessibility</option>
                <option value="content">Content</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: currentTheme.colors.text.tertiary }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text.primary,
                }}
              >
                <option value="severity">Severity</option>
                <option value="confidence">Confidence</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </ThemedCardContent>
      </ThemedCard>

      {/* Findings List */}
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Issues Found"
          subtitle={`${filteredFindings.length} issue${filteredFindings.length !== 1 ? 's' : ''}`}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="mt-4 space-y-3">
            {filteredFindings.length === 0 ? (
              <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
                {findings.length === 0 ? 'No issues found! 🎉' : 'No issues match the current filters'}
              </div>
            ) : (
              filteredFindings.map((finding, index) => (
                <FindingCard key={index} finding={finding} index={index} />
              ))
            )}
          </div>
        </ThemedCardContent>
      </ThemedCard>
    </div>
  );
}
