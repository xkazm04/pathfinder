'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Terminal, Network, AlertCircle, FileText, Copy } from 'lucide-react';
import { ConsoleLog } from '@/lib/types';

interface LiveLogsPanelProps {
  logs: ConsoleLog[];
  networkLogs?: Array<{ url: string; method: string; status: number }>;
  errors?: Array<{ message: string; timestamp: string }>;
}

export function LiveLogsPanel({ logs, networkLogs = [], errors = [] }: LiveLogsPanelProps) {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'console' | 'network' | 'errors'>('console');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, networkLogs, errors, autoScroll]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warn':
      case 'warning':
        return '#f97316';
      case 'info':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.secondary;
    }
  };

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
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Live Logs"
        subtitle="Real-time execution logs"
        icon={<FileText className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: autoScroll ? currentTheme.colors.primary : currentTheme.colors.surface,
                color: autoScroll ? '#fff' : currentTheme.colors.text.secondary,
              }}
            >
              Auto-scroll
            </button>
            <button
              onClick={copyLogs}
              className="p-1 rounded"
              style={{ color: currentTheme.colors.text.secondary }}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <ThemedCardContent>
        {/* Tabs */}
        <div className="flex gap-2 border-b mt-4" style={{ borderColor: currentTheme.colors.border }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
                    <span style={{ color: getLogColor(log.type) }}>[{log.type.toUpperCase()}]</span>
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
                    <span
                      style={{
                        color: log.status >= 200 && log.status < 300 ? '#22c55e' : log.status >= 400 ? '#ef4444' : currentTheme.colors.text.secondary,
                      }}
                    >
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
      </ThemedCardContent>
    </ThemedCard>
  );
}
