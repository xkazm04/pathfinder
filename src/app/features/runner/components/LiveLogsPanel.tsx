'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { Terminal, Network, AlertCircle, FileText, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { ConsoleLog } from '@/lib/types';

interface LiveLogsPanelProps {
  logs: ConsoleLog[];
  networkLogs?: Array<{ url: string; method: string; status: number }>;
  errors?: Array<{ message: string; timestamp: string }>;
}

// Helper function for log type colors
function getLogColor(type: string, accentColor: string, secondaryColor: string) {
  const colors = {
    error: '#ef4444',
    warn: '#f97316',
    warning: '#f97316',
    info: accentColor,
    default: secondaryColor,
  };
  return colors[type as keyof typeof colors] || colors.default;
}

// Helper function for network status colors
function getNetworkStatusColor(status: number) {
  if (status >= 200 && status < 300) return '#22c55e';
  if (status >= 400) return '#ef4444';
  return '#94a3b8'; // gray for other statuses
}

export function LiveLogsPanel({ logs, networkLogs = [], errors = [] }: LiveLogsPanelProps) {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'console' | 'network' | 'errors'>('console');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, networkLogs, errors, autoScroll]);

  const copyLogs = () => {
    let text = '';
    if (activeTab === 'console') {
      text = logs.map(log => `[${log.type}] ${log.message}`).join('\n');
    } else if (activeTab === 'network') {
      text = networkLogs.map(log => `${log.method} ${log.url} - ${log.status}`).join('\n');
    } else {
      text = errors.map(err => err.message).join('\n');
    }
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'console', label: 'Console', icon: Terminal, count: logs.length },
    { id: 'network', label: 'Network', icon: Network, count: networkLogs.length },
    { id: 'errors', label: 'Errors', icon: AlertCircle, count: errors.length },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-all"
      style={{
        backgroundColor: currentTheme.colors.background,
        borderTopWidth: '2px',
        borderTopStyle: 'solid',
        borderTopColor: currentTheme.colors.border,
      }}
    >
      {/* Header Bar - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-3 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: currentTheme.colors.surface }}
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
          <h3 className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
            Live Logs
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${currentTheme.colors.primary}20`, color: currentTheme.colors.primary }}>
            {logs.length} logs
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoScroll(!autoScroll);
                }}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: autoScroll ? currentTheme.colors.primary : currentTheme.colors.surface,
                  color: autoScroll ? '#fff' : currentTheme.colors.text.secondary,
                }}
              >
                Auto-scroll
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyLogs();
                }}
                className="p-1 rounded"
                style={{ color: currentTheme.colors.text.secondary }}
              >
                <Copy className="w-4 h-4" />
              </button>
            </>
          )}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
          ) : (
            <ChevronUp className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
          )}
        </div>
      </button>

      {/* Minimized Preview - Last 3 Logs */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-6 py-2 overflow-hidden"
        >
          <div
            className="font-mono text-xs space-y-1 p-2 rounded"
            style={{
              backgroundColor: currentTheme.colors.surface,
            }}
          >
            {activeTab === 'console' && (
              <>
                {logs.length === 0 ? (
                  <div style={{ color: currentTheme.colors.text.tertiary }}>No console logs yet...</div>
                ) : (
                  logs.slice(-3).map((log, index) => (
                    <div key={index} className="flex gap-2 truncate">
                      <span style={{ color: currentTheme.colors.text.tertiary }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span style={{ color: getLogColor(log.type, currentTheme.colors.accent, currentTheme.colors.text.secondary) }}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span style={{ color: currentTheme.colors.text.secondary }} className="truncate">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'network' && (
              <>
                {networkLogs.length === 0 ? (
                  <div style={{ color: currentTheme.colors.text.tertiary }}>No network activity yet...</div>
                ) : (
                  networkLogs.slice(-3).map((log, index) => (
                    <div key={index} className="flex gap-2 truncate">
                      <span style={{ color: currentTheme.colors.accent }}>{log.method}</span>
                      <span style={{ color: getNetworkStatusColor(log.status) }}>
                        [{log.status}]
                      </span>
                      <span style={{ color: currentTheme.colors.text.secondary }} className="truncate">
                        {log.url}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'errors' && (
              <>
                {errors.length === 0 ? (
                  <div style={{ color: '#22c55e' }}>No errors ✓</div>
                ) : (
                  errors.slice(-3).map((error, index) => (
                    <div key={index} className="truncate" style={{ color: '#ef4444' }}>
                      {error.message}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b mt-4" style={{ borderColor: currentTheme.colors.border }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'console' | 'network' | 'errors')}
                className="flex items-center gap-2 px-4 py-2 transition-colors relative"
                style={{
                  color: activeTab === tab.id ? currentTheme.colors.primary : currentTheme.colors.text.tertiary,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                <span
                  className="text-xs px-1.5 rounded-full"
                  style={{
                    backgroundColor: `${activeTab === tab.id ? currentTheme.colors.primary : currentTheme.colors.text.tertiary}20`,
                  }}
                >
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: currentTheme.colors.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Log Content */}
        <div
          className="mt-4 max-h-[400px] overflow-y-auto font-mono text-xs p-3 rounded"
          style={{
            backgroundColor: currentTheme.colors.surface,
          }}
        >
          {activeTab === 'console' && (
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div style={{ color: currentTheme.colors.text.tertiary }}>No console logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span style={{ color: currentTheme.colors.text.tertiary }}>
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span style={{ color: getLogColor(log.type, currentTheme.colors.accent, currentTheme.colors.text.secondary) }}>[{log.type.toUpperCase()}]</span>
                    <span style={{ color: currentTheme.colors.text.secondary }}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-1">
              {networkLogs.length === 0 ? (
                <div style={{ color: currentTheme.colors.text.tertiary }}>No network activity yet...</div>
              ) : (
                networkLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span style={{ color: currentTheme.colors.accent }}>{log.method}</span>
                    <span style={{ color: getNetworkStatusColor(log.status) }}>
                      [{log.status}]
                    </span>
                    <span style={{ color: currentTheme.colors.text.secondary }} className="truncate">
                      {log.url}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-2">
              {errors.length === 0 ? (
                <div style={{ color: '#22c55e' }}>No errors \u2713</div>
              ) : (
                errors.map((error, index) => (
                  <div key={index} className="p-2 rounded" style={{ backgroundColor: '#ef444410' }}>
                    <div style={{ color: '#ef4444' }}>{error.message}</div>
                    <div className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                      {error.timestamp}
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
