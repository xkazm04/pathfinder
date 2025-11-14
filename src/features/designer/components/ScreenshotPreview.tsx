'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader } from '@/components/ui/ThemedCard';
import { ScreenshotMetadata } from '@/lib/types';
import { X, ZoomIn, Download } from 'lucide-react';
import { ThemedButton } from '@/components/ui/ThemedButton';

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

  const handleDownload = (screenshot: ScreenshotMetadata) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${screenshot.base64}`;
    link.download = `${screenshot.viewportName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title={title}
          subtitle={`${screenshots.length} viewport${screenshots.length !== 1 ? 's' : ''} captured`}
          icon={<ZoomIn className="w-5 h-5" />}
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
                <img
                  src={`data:image/png;base64,${screenshot.base64}`}
                  alt={screenshot.viewportName}
                  className="w-full h-48 object-cover object-top transition-transform group-hover:scale-105"
                />

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

              {/* Image */}
              <div className="p-4">
                <img
                  src={`data:image/png;base64,${selectedScreenshot.base64}`}
                  alt={selectedScreenshot.viewportName}
                  className="w-full rounded-lg"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
