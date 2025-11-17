'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader } from '@/components/ui/ThemedCard';
import { ScreenshotMetadata } from '@/lib/types';
import { X, ZoomIn, Download, FileText, Brain, Sparkles, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { downloadFile, downloadImageFromBase64 } from '../lib/formHelpers';
import Image from 'next/image';
import type { Finding } from '@/lib/supabase/aiAnalyses';

interface ScreenshotPreviewProps {
  screenshots: ScreenshotMetadata[];
  title?: string;
}

export function ScreenshotPreview({
  screenshots,
  title = 'Captured Screenshots',
}: ScreenshotPreviewProps) {
  const { currentTheme } = useTheme();
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotMetadata | null>(null);
  const [aiFindings, setAiFindings] = useState<Finding[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load DOM snapshot into iframe when selected
  useEffect(() => {
    if (selectedScreenshot?.domSnapshot && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(selectedScreenshot.domSnapshot);
        iframeDoc.close();
      }
    }
  }, [selectedScreenshot]);

  const handleDownload = (screenshot: ScreenshotMetadata) => {
    const filename = screenshot.viewportName.replace(/\s+/g, '-').toLowerCase();

    if (screenshot.previewMode === 'lightweight' && screenshot.domSnapshot) {
      downloadFile(screenshot.domSnapshot, `${filename}.html`, 'text/html');
    } else if (screenshot.base64) {
      downloadImageFromBase64(screenshot.base64, `${filename}.png`);
    } else if (screenshot.screenshotUrl) {
      // Download from URL
      const link = document.createElement('a');
      link.href = screenshot.screenshotUrl;
      link.download = `${filename}.png`;
      link.click();
    }
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    setShowAIAnalysis(true);
    setAiFindings([]);

    try {
      // Extract screenshot URLs
      const screenshotUrls = screenshots
        .map(s => s.screenshotUrl)
        .filter(Boolean) as string[];

      if (screenshotUrls.length === 0) {
        throw new Error('No screenshot URLs available for analysis');
      }

      const response = await fetch('/api/gemini/analyze-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshots: screenshotUrls,
          analysisType: 'comprehensive',
          context: {
            testName: 'Designer Preview',
            viewport: screenshots.map(s => s.viewportName).join(', '),
            targetUrl: window.location.origin,
            testStatus: 'preview',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      setAiFindings(data.findings || []);
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      alert(`AI Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f97316';
      case 'info':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <>
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title={title}
          subtitle={`${screenshots.length} viewport${screenshots.length !== 1 ? 's' : ''} captured ${screenshots[0]?.previewMode === 'lightweight' ? '(Lightweight)' : '(Full)'}`}
          icon={screenshots[0]?.previewMode === 'lightweight' ? <FileText className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenshots.map((screenshot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group relative rounded-lg overflow-hidden cursor-pointer"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
                onClick={() => setSelectedScreenshot(screenshot)}
              >
                {/* Screenshot Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={screenshot.screenshotUrl || (screenshot.base64 ? `data:image/png;base64,${screenshot.base64}` : '')}
                    alt={screenshot.viewportName}
                    fill
                    className="object-cover object-top transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                </div>

                {/* Overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{
                    background: `${currentTheme.colors.surface}cc`,
                  }}
                >
                  <ThemedButton
                    variant="primary"
                    size="sm"
                    leftIcon={<ZoomIn className="w-4 h-4" />}
                  >
                    View Full
                  </ThemedButton>
                </div>

                {/* Label */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2"
                  style={{
                    background: `linear-gradient(to top, ${currentTheme.colors.surface}ee, transparent)`,
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                    {screenshot.viewportName}
                  </p>
                  <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    {screenshot.width} × {screenshot.height}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Analysis Button */}
          <div className="mt-6 flex items-center gap-4">
            <ThemedButton
              variant="secondary"
              size="md"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || screenshots.length === 0}
              leftIcon={isAnalyzing ? <Brain className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            >
              {isAnalyzing ? 'Analyzing with AI...' : 'Analyze Screenshots with AI'}
            </ThemedButton>
            {aiFindings.length > 0 && (
              <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                {aiFindings.length} issue{aiFindings.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          {/* AI Analysis Results */}
          <AnimatePresence>
            {showAIAnalysis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 overflow-hidden"
              >
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: `${currentTheme.colors.accent}10`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${currentTheme.colors.accent}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5" style={{ color: currentTheme.colors.accent }} />
                    <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                      AI Visual Analysis
                    </h3>
                  </div>

                  {isAnalyzing && (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: currentTheme.colors.accent }} />
                      <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                        Analyzing screenshots for visual, functional, and accessibility issues...
                      </p>
                    </div>
                  )}

                  {!isAnalyzing && aiFindings.length === 0 && (
                    <div
                      className="text-center py-8 rounded-lg"
                      style={{
                        backgroundColor: `${currentTheme.colors.primary}10`,
                        color: currentTheme.colors.text.secondary,
                      }}
                    >
                      <p className="text-sm">No issues detected! Your screenshots look good. ✓</p>
                    </div>
                  )}

                  {!isAnalyzing && aiFindings.length > 0 && (
                    <div className="space-y-3">
                      {aiFindings.map((finding, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: `${getSeverityColor(finding.severity)}10`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: `${getSeverityColor(finding.severity)}30`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div style={{ color: getSeverityColor(finding.severity) }}>
                              {getSeverityIcon(finding.severity)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-xs font-semibold uppercase px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${getSeverityColor(finding.severity)}20`,
                                    color: getSeverityColor(finding.severity),
                                  }}
                                >
                                  {finding.severity}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: currentTheme.colors.surface,
                                    color: currentTheme.colors.text.tertiary,
                                  }}
                                >
                                  {finding.category}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: currentTheme.colors.text.tertiary }}
                                >
                                  {(finding.confidenceScore * 100).toFixed(0)}% confidence
                                </span>
                              </div>
                              <p className="font-medium mb-1" style={{ color: currentTheme.colors.text.primary }}>
                                {finding.issue}
                              </p>
                              {finding.location && (
                                <p className="text-sm mb-2" style={{ color: currentTheme.colors.text.tertiary }}>
                                  📍 {finding.location}
                                </p>
                              )}
                              <div
                                className="text-sm p-2 rounded"
                                style={{
                                  backgroundColor: currentTheme.colors.surface,
                                  color: currentTheme.colors.text.secondary,
                                }}
                              >
                                <span className="font-semibold" style={{ color: currentTheme.colors.accent }}>
                                  Recommendation:
                                </span>{' '}
                                {finding.recommendation}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ThemedCard>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-7xl w-full max-h-[90vh] overflow-auto rounded-xl"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.borderHover,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 flex items-center justify-between p-4"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderBottom: `1px solid ${currentTheme.colors.border}`,
                }}
              >
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                    {selectedScreenshot.viewportName}
                  </h3>
                  <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                    {selectedScreenshot.width} × {selectedScreenshot.height}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ThemedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(selectedScreenshot)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </ThemedButton>
                  <button
                    onClick={() => setSelectedScreenshot(null)}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      color: currentTheme.colors.text.secondary,
                      backgroundColor: currentTheme.colors.surfaceHover,
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image or DOM Snapshot */}
              <div className="p-4">
                {selectedScreenshot.previewMode === 'lightweight' && selectedScreenshot.domSnapshot ? (
                  <iframe
                    ref={iframeRef}
                    className="w-full rounded-lg"
                    style={{
                      height: '600px',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                      backgroundColor: '#ffffff',
                    }}
                    sandbox="allow-same-origin"
                    title={`Preview: ${selectedScreenshot.viewportName}`}
                    data-testid="lightweight-preview-iframe"
                  />
                ) : (
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                    <Image
                      src={selectedScreenshot.screenshotUrl || (selectedScreenshot.base64 ? `data:image/png;base64,${selectedScreenshot.base64}` : '')}
                      alt={selectedScreenshot.viewportName}
                      width={selectedScreenshot.width}
                      height={selectedScreenshot.height}
                      className="w-full h-auto rounded-lg"
                      style={{
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                      }}
                      data-testid="full-preview-image"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
