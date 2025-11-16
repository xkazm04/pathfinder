'use client';

import { useTheme } from '@/lib/stores/appStore';
import { BranchDiff, CodeChange } from '@/lib/types';
import { Plus, Minus, FileCode, Settings } from 'lucide-react';
import { ThemedCard, ThemedCardHeader } from '@/components/ui/ThemedCard';

interface DiffViewerProps {
  diffs: BranchDiff[];
}

export function DiffViewer({ diffs }: DiffViewerProps) {
  const { currentTheme } = useTheme();

  if (diffs.length === 0) {
    return (
      <ThemedCard variant="glass" data-testid="diff-viewer-empty">
        <div
          className="text-center py-8"
          style={{ color: currentTheme.colors.text.secondary }}
        >
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No differences found</p>
        </div>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-4" data-testid="diff-viewer">
      {diffs.map((diff, index) => (
        <ThemedCard key={diff.id || index} variant="bordered">
          <ThemedCardHeader
            icon={diff.diff_type === 'code' ? <FileCode className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            title={`${diff.diff_type === 'code' ? 'Code' : 'Configuration'} Changes`}
            subtitle={diff.changes.summary}
          />

          <div className="space-y-3">
            {/* Additions */}
            {diff.changes.additions && diff.changes.additions.length > 0 && (
              <div data-testid="diff-additions">
                <div
                  className="text-xs font-semibold mb-2 flex items-center gap-2"
                  style={{ color: currentTheme.colors.text.secondary }}
                >
                  <Plus className="w-3.5 h-3.5 text-green-500" />
                  <span>{diff.changes.additions.length} Additions</span>
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: `${currentTheme.colors.background}40`,
                    borderColor: '#22c55e40',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  {diff.changes.additions.map((change: CodeChange, idx: number) => (
                    <DiffLine
                      key={idx}
                      change={change}
                      type="addition"
                      lineNumber={change.line}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Deletions */}
            {diff.changes.deletions && diff.changes.deletions.length > 0 && (
              <div data-testid="diff-deletions">
                <div
                  className="text-xs font-semibold mb-2 flex items-center gap-2"
                  style={{ color: currentTheme.colors.text.secondary }}
                >
                  <Minus className="w-3.5 h-3.5 text-red-500" />
                  <span>{diff.changes.deletions.length} Deletions</span>
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: `${currentTheme.colors.background}40`,
                    borderColor: '#ef444440',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  {diff.changes.deletions.map((change: CodeChange, idx: number) => (
                    <DiffLine
                      key={idx}
                      change={change}
                      type="deletion"
                      lineNumber={change.line}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Modifications */}
            {diff.changes.modifications && diff.changes.modifications.length > 0 && (
              <div data-testid="diff-modifications">
                <div
                  className="text-xs font-semibold mb-2 flex items-center gap-2"
                  style={{ color: currentTheme.colors.text.secondary }}
                >
                  <FileCode className="w-3.5 h-3.5 text-yellow-500" />
                  <span>{diff.changes.modifications.length} Modifications</span>
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: `${currentTheme.colors.background}40`,
                    borderColor: '#eab30840',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  {diff.changes.modifications.map((change: CodeChange, idx: number) => (
                    <div key={idx} className="border-b last:border-b-0" style={{ borderColor: `${currentTheme.colors.border}40` }}>
                      {change.context && (
                        <DiffLine
                          change={{ ...change, content: change.context, type: 'remove' }}
                          type="deletion"
                          lineNumber={change.line}
                        />
                      )}
                      <DiffLine
                        change={change}
                        type="addition"
                        lineNumber={change.line}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ThemedCard>
      ))}
    </div>
  );
}

interface DiffLineProps {
  change: CodeChange;
  type: 'addition' | 'deletion';
  lineNumber?: number;
}

function DiffLine({ change, type, lineNumber }: DiffLineProps) {
  const { currentTheme } = useTheme();

  const bgColor = type === 'addition' ? '#22c55e10' : '#ef444410';
  const iconColor = type === 'addition' ? '#22c55e' : '#ef4444';
  const Icon = type === 'addition' ? Plus : Minus;

  return (
    <div
      className="flex items-start gap-3 px-3 py-2 font-mono text-xs border-b last:border-b-0"
      style={{
        background: bgColor,
        borderColor: `${currentTheme.colors.border}20`,
        color: currentTheme.colors.text.primary,
      }}
      data-testid={`diff-line-${type}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: iconColor }} />
      {lineNumber && (
        <span
          className="w-10 text-right shrink-0"
          style={{ color: currentTheme.colors.text.tertiary }}
        >
          {lineNumber}
        </span>
      )}
      <code className="flex-1 whitespace-pre-wrap break-all">{change.content}</code>
    </div>
  );
}
