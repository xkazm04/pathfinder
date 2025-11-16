'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PluginAction, PluginParameter, PluginStepData } from '@/lib/types';
import { getAllPlugins, getPluginsByCategory } from '@/lib/plugins/pluginRegistry';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  Target,
  Upload,
  Move,
  Database,
  Cookie,
  Code,
} from 'lucide-react';
import {
  filterPluginsWithTags,
  groupPluginsByCategory,
  validatePluginForm,
} from '../lib/pluginHelpers';

interface PluginActionSelectorProps {
  onSelect: (pluginData: PluginStepData) => void;
  onCancel: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Target,
  Upload,
  Move,
  Database,
  Cookie,
  Code,
};

export function PluginActionSelector({ onSelect, onCancel }: PluginActionSelectorProps) {
  const { currentTheme } = useTheme();
  const [selectedPlugin, setSelectedPlugin] = useState<PluginAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['interaction', 'api', 'data'])
  );
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});

  const allPlugins = getAllPlugins();

  // Filter plugins by search query
  const filteredPlugins = useMemo(() => {
    return filterPluginsWithTags(allPlugins, searchQuery);
  }, [allPlugins, searchQuery]);

  // Group plugins by category
  const pluginsByCategory = useMemo(() => {
    return groupPluginsByCategory(filteredPlugins);
  }, [filteredPlugins]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectPlugin = (plugin: PluginAction) => {
    setSelectedPlugin(plugin);
    // Initialize parameter values with defaults
    const defaults: Record<string, unknown> = {};
    plugin.parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        defaults[param.name] = param.defaultValue;
      }
    });
    setParameterValues(defaults);
  };

  const handleParameterChange = (paramName: string, value: unknown) => {
    setParameterValues((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleConfirm = () => {
    if (!selectedPlugin) return;

    const pluginData: PluginStepData = {
      pluginId: selectedPlugin.metadata.id,
      actionType: selectedPlugin.actionType,
      parameters: parameterValues,
      metadata: selectedPlugin.metadata,
    };

    onSelect(pluginData);
  };

  const validateForm = (): boolean => {
    if (!selectedPlugin) return false;
    return validatePluginForm(selectedPlugin, parameterValues);
  };

  const renderParameterInput = (param: PluginParameter) => {
    const value = parameterValues[param.name];

    switch (param.type) {
      case 'string':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid={`plugin-param-${param.name}`}
          />
        );

      case 'multiline':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            rows={3}
            className="w-full px-3 py-2 rounded border resize-vertical"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid={`plugin-param-${param.name}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
            placeholder={param.placeholder}
            min={param.validation?.min}
            max={param.validation?.max}
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid={`plugin-param-${param.name}`}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => handleParameterChange(param.name, e.target.checked)}
              className="w-4 h-4"
              data-testid={`plugin-param-${param.name}`}
            />
            <span style={{ color: currentTheme.colors.text.secondary }}>Enabled</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid={`plugin-param-${param.name}`}
          >
            <option value="">Select...</option>
            {param.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'json':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.placeholder || '{}'}
            rows={4}
            className="w-full px-3 py-2 rounded border font-mono text-sm resize-vertical"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid={`plugin-param-${param.name}`}
          />
        );

      default:
        return null;
    }
  };

  if (selectedPlugin) {
    return (
      <ThemedCard variant="default">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedPlugin.metadata.icon && iconMap[selectedPlugin.metadata.icon] && (
                <div className="p-2 rounded" style={{ backgroundColor: currentTheme.colors.surface }}>
                  {(() => {
                    const Icon = iconMap[selectedPlugin.metadata.icon!];
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
                  {selectedPlugin.metadata.displayName}
                </h3>
                <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                  {selectedPlugin.metadata.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPlugin(null)}
              className="px-3 py-1 text-sm rounded"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.secondary,
              }}
              data-testid="plugin-back-btn"
            >
              Back
            </button>
          </div>

          <div className="space-y-4">
            {selectedPlugin.parameters.map((param) => (
              <div key={param.name}>
                <label className="block mb-1 text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                  {param.label}
                  {param.required && <span style={{ color: '#ff4444' }}> *</span>}
                </label>
                {renderParameterInput(param)}
                {param.description && (
                  <p className="mt-1 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    {param.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirm}
              disabled={!validateForm()}
              className="flex-1 px-4 py-2 rounded font-medium disabled:opacity-50"
              style={{
                backgroundColor: currentTheme.colors.primary,
                color: currentTheme.colors.text.primary,
              }}
              data-testid="plugin-confirm-btn"
            >
              Add Action
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.secondary,
              }}
              data-testid="plugin-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard variant="default">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.colors.text.primary }}>
          Select Plugin Action
        </h3>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins..."
            className="w-full pl-10 pr-4 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text.primary,
            }}
            data-testid="plugin-search-input"
          />
        </div>

        {/* Plugin Categories */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Object.entries(pluginsByCategory).map(([category, plugins]) => (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: currentTheme.colors.surface }}
                data-testid={`plugin-category-${category}`}
              >
                <span className="font-medium capitalize" style={{ color: currentTheme.colors.text.primary }}>
                  {category} ({plugins.length})
                </span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="ml-4 mt-1 space-y-1">
                  {plugins.map((plugin) => {
                    const Icon = plugin.metadata.icon && iconMap[plugin.metadata.icon] ? iconMap[plugin.metadata.icon] : Code;
                    return (
                      <button
                        key={plugin.metadata.id}
                        onClick={() => selectPlugin(plugin)}
                        className="w-full flex items-start gap-3 px-3 py-2 rounded hover:bg-opacity-80 transition-colors text-left"
                        style={{ backgroundColor: currentTheme.colors.surface }}
                        data-testid={`plugin-item-${plugin.metadata.id}`}
                      >
                        <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: currentTheme.colors.accent }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                            {plugin.metadata.displayName}
                          </div>
                          <div className="text-sm truncate" style={{ color: currentTheme.colors.text.tertiary }}>
                            {plugin.metadata.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.secondary,
            }}
            data-testid="plugin-selector-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </ThemedCard>
  );
}
