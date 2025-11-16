'use client';

import { useState, useEffect } from 'react';
import { useTheme, useSelectorScanner } from '@/lib/stores/appStore';
import { X, Search, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { detectSelectors } from '../sub_FlowSelectors/lib';
import { getElementIcon, getTypeColor } from '../sub_FlowSelectors/lib';
import type { DetectedElement } from '@/lib/stores/appStore';

interface SelectorModalProps {
  isOpen: boolean;
  targetUrl: string;
  onClose: () => void;
  onSelectSelector: (selector: string, elementInfo: DetectedElement) => void;
}

export function SelectorModal({
  isOpen,
  targetUrl,
  onClose,
  onSelectSelector,
}: SelectorModalProps) {
  const { currentTheme } = useTheme();
  const {
    scannedElements,
    scannedTargetUrl,
    setScannedElements,
    getScannedElements
  } = useSelectorScanner();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get elements from store or empty array
  const elements = getScannedElements(targetUrl);

  // Auto-load on open if no cached elements for this URL
  useEffect(() => {
    if (isOpen && elements.length === 0) {
      handleScan();
    }
  }, [isOpen, targetUrl]);

  const handleScan = async () => {
    try {
      setLoading(true);
      setError(null);
      const detectedElements = await detectSelectors(targetUrl);
      // Save to Zustand store
      setScannedElements(detectedElements, targetUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect selectors';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (selector: string, element: DetectedElement) => {
    onSelectSelector(selector, element);
    onClose();
  };

  // Group elements by type
  const elementsByType = elements.reduce((acc, el) => {
    if (!acc[el.type]) acc[el.type] = [];
    acc[el.type].push(el);
    return acc;
  }, {} as Record<string, DetectedElement[]>);

  // Filter elements by search term
  const filteredElementsByType = Object.entries(elementsByType).reduce((acc, [type, elems]) => {
    const filtered = elems.filter(el =>
      el.selector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.placeholder?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {} as Record<string, DetectedElement[]>);

  // Order: link, button, input, select, other
  const typeOrder = ['link', 'button', 'input', 'select', 'text', 'other'];
  const orderedTypes = typeOrder.filter(type => filteredElementsByType[type]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
        style={{
          backgroundColor: currentTheme.colors.background,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: currentTheme.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            backgroundColor: currentTheme.colors.surface,
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: currentTheme.colors.border,
          }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: currentTheme.colors.text.primary }}
            >
              Select Element
            </h2>
            <p
              className="text-sm"
              style={{ color: currentTheme.colors.text.tertiary }}
            >
              {elements.length} elements detected from {targetUrl}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              disabled={loading}
              className="px-3 py-2 rounded transition-all flex items-center gap-2"
              style={{
                backgroundColor: currentTheme.colors.primary + '20',
                color: currentTheme.colors.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.primary + '40',
                opacity: loading ? 0.5 : 1,
              }}
              title="Refresh scan"
            >
              {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded transition-colors hover:bg-red-500/10"
              style={{
                color: currentTheme.colors.text.secondary,
              }}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 relative">
          <Search
            className="absolute left-9 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: currentTheme.colors.text.tertiary }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search selectors..."
            className="w-full pl-10 pr-4 py-2 rounded text-sm"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12" style={{ color: '#ef4444' }}>
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {orderedTypes.map((type) => {
                const typeElements = filteredElementsByType[type];
                const typeColor = getTypeColor(type, currentTheme.colors.text.secondary);

                return (
                  <div key={type}>
                    {/* Column Header */}
                    <div
                      className="px-3 py-2 rounded-t font-medium text-sm uppercase tracking-wide flex items-center gap-2"
                      style={{
                        backgroundColor: typeColor + '20',
                        color: typeColor,
                      }}
                    >
                      {getElementIcon(type)}
                      <span>{type}</span>
                      <span className="ml-auto text-xs">({typeElements.length})</span>
                    </div>

                    {/* Elements List */}
                    <div
                      className="rounded-b overflow-hidden"
                      style={{
                        backgroundColor: currentTheme.colors.surface,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                        borderTopWidth: '0',
                      }}
                    >
                      <div className="max-h-[500px] overflow-y-auto">
                        {typeElements.map((element, index) => (
                          <button
                            key={`${element.selector}-${index}`}
                            onClick={() => handleSelect(element.selector, element)}
                            className="w-full px-3 py-2 text-left transition-all hover:brightness-110 border-b last:border-b-0"
                            style={{
                              backgroundColor: currentTheme.colors.surface,
                              borderColor: currentTheme.colors.border,
                            }}
                          >
                            <code
                              className="text-xs font-mono block truncate mb-1"
                              style={{ color: currentTheme.colors.text.primary }}
                            >
                              {element.selector}
                            </code>
                            {(element.text || element.placeholder || element.ariaLabel) && (
                              <p
                                className="text-[10px] truncate"
                                style={{ color: currentTheme.colors.text.tertiary }}
                              >
                                {element.text || element.placeholder || element.ariaLabel}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
