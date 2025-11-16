'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import {
  Image,
  Layers,
  SplitSquareHorizontal,
  Check,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type ViewMode = 'side-by-side' | 'overlay' | 'diff' | 'blend' | 'split';

interface DiffViewerProps {
  baselineUrl: string;
  currentUrl: string;
  diffUrl?: string;
  testName: string;
  viewport: string;
  pixelsDifferent?: number;
  percentageDifferent?: number;
  isSignificant?: boolean;
  threshold?: number;
  dimensions?: { width: number; height: number };
  onReview?: (status: 'approved' | 'bug_reported' | 'investigating' | 'false_positive') => void;
}

/**
 * Advanced diff viewer with multiple comparison modes
 * Features:
 * - Side-by-side view
 * - Overlay with opacity slider
 * - Diff highlight view
 * - Blend mode
 * - Split view with draggable divider
 * - Zoom controls
 * - Review actions
 */
export function DiffViewer({
  baselineUrl,
  currentUrl,
  diffUrl,
  testName,
  viewport,
  pixelsDifferent = 0,
  percentageDifferent = 0,
  isSignificant = false,
  threshold = 0.1,
  dimensions,
  onReview,
}: DiffViewerProps) {
  const { currentTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [opacity, setOpacity] = useState(0.5);
  const [splitPosition, setSplitPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const hasDiff = percentageDifferent > 0;
  const exceedsThreshold = percentageDifferent > threshold * 100;

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || viewMode !== 'split' || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReview = (status: 'approved' | 'bug_reported' | 'investigating' | 'false_positive') => {
    onReview?.(status);
  };

  const viewModeButtons = [
    { mode: 'side-by-side' as ViewMode, label: 'Side-by-side', icon: SplitSquareHorizontal },
    { mode: 'overlay' as ViewMode, label: 'Overlay', icon: Layers },
    { mode: 'diff' as ViewMode, label: 'Diff', icon: AlertTriangle },
    { mode: 'blend' as ViewMode, label: 'Blend', icon: Image },
    { mode: 'split' as ViewMode, label: 'Split', icon: SplitSquareHorizontal },
  ];

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title={`${testName} - ${viewport}`}
        subtitle={`Visual comparison ${dimensions ? `(${dimensions.width}x${dimensions.height})` : ''}`}
        icon={<Image className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {viewModeButtons.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                style={{
                  backgroundColor:
                    viewMode === mode ? currentTheme.colors.primary : currentTheme.colors.surface,
                  color:
                    viewMode === mode ? '#ffffff' : currentTheme.colors.text.secondary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        }
      />
      <ThemedCardContent>
        {/* Status Banner */}
        {hasDiff && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: exceedsThreshold ? '#ef444410' : '#f59e0b10',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: exceedsThreshold ? '#ef444430' : '#f59e0b30',
            }}
          >
            <AlertTriangle
              className="w-5 h-5 shrink-0"
              style={{ color: exceedsThreshold ? '#ef4444' : '#f59e0b' }}
            />
            <div className="flex-1">
              <p
                className="text-sm font-medium"
                style={{ color: exceedsThreshold ? '#ef4444' : '#f59e0b' }}
              >
                {exceedsThreshold ? 'Significant visual difference detected' : 'Minor visual difference'}
              </p>
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                {pixelsDifferent.toLocaleString()} pixels different ({percentageDifferent.toFixed(2)}%)
                {threshold && ` - Threshold: ${(threshold * 100).toFixed(0)}%`}
              </p>
            </div>
          </motion.div>
        )}

        {!hasDiff && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: '#22c55e10',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#22c55e30',
            }}
          >
            <Check className="w-5 h-5 shrink-0" style={{ color: '#22c55e' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                No visual differences
              </p>
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Screenshots match perfectly
              </p>
            </div>
          </motion.div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" style={{ color: currentTheme.colors.text.primary }} />
            </button>
            <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" style={{ color: currentTheme.colors.text.primary }} />
            </button>
          </div>

          {/* Opacity Slider for Overlay Mode */}
          {viewMode === 'overlay' && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                Opacity:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                className="w-32"
              />
              <span className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                {(opacity * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Screenshot Comparison View */}
        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden relative select-none"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: currentTheme.colors.border,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-2 gap-0">
              {/* Baseline */}
              <div>
                <div
                  className="p-2 text-center text-xs font-medium"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: currentTheme.colors.border,
                  }}
                >
                  Baseline
                </div>
                <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                  <img
                    src={baselineUrl}
                    alt="Baseline screenshot"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Current */}
              <div
                style={{
                  borderLeftWidth: '1px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: currentTheme.colors.border,
                }}
              >
                <div
                  className="p-2 text-center text-xs font-medium"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: currentTheme.colors.border,
                  }}
                >
                  Current
                </div>
                <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                  <img
                    src={currentUrl}
                    alt="Current screenshot"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'diff' && diffUrl && (
            <div>
              <div
                className="p-2 text-center text-xs font-medium"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: currentTheme.colors.border,
                }}
              >
                Difference Highlight (Red = Changed)
              </div>
              <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                <img
                  src={diffUrl}
                  alt="Diff screenshot"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {viewMode === 'overlay' && (
            <div>
              <div
                className="p-2 text-center text-xs font-medium"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: currentTheme.colors.border,
                }}
              >
                Overlay Comparison
              </div>
              <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
                <img
                  src={baselineUrl}
                  alt="Baseline screenshot"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  className="w-full"
                />
                <img
                  src={currentUrl}
                  alt="Current screenshot"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    opacity,
                  }}
                  className="w-full absolute top-0 left-0"
                />
              </div>
            </div>
          )}

          {viewMode === 'blend' && (
            <div>
              <div
                className="p-2 text-center text-xs font-medium"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: currentTheme.colors.border,
                }}
              >
                Blend Mode
              </div>
              <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
                <img
                  src={baselineUrl}
                  alt="Baseline screenshot"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  className="w-full"
                />
                <img
                  src={currentUrl}
                  alt="Current screenshot"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    mixBlendMode: 'difference',
                  }}
                  className="w-full absolute top-0 left-0"
                />
              </div>
            </div>
          )}

          {viewMode === 'split' && (
            <div>
              <div
                className="p-2 text-center text-xs font-medium"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: currentTheme.colors.border,
                }}
              >
                Split View (Drag to compare)
              </div>
              <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
                <img
                  src={currentUrl}
                  alt="Current screenshot"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  className="w-full"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${splitPosition}%`,
                    height: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={baselineUrl}
                    alt="Baseline screenshot"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
                    }}
                  />
                </div>
                <div
                  onMouseDown={handleMouseDown}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${splitPosition}%`,
                    width: '4px',
                    height: '100%',
                    backgroundColor: currentTheme.colors.primary,
                    cursor: 'ew-resize',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Review Actions */}
        {onReview && isSignificant && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
              Review:
            </span>
            <button
              onClick={() => handleReview('approved')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: '#22c55e',
                color: '#ffffff',
              }}
            >
              Approve
            </button>
            <button
              onClick={() => handleReview('bug_reported')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
              }}
            >
              Report Bug
            </button>
            <button
              onClick={() => handleReview('investigating')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
              }}
            >
              Investigate
            </button>
            <button
              onClick={() => handleReview('false_positive')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              False Positive
            </button>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
