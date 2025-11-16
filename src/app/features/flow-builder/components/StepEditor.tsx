'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { FlowStep } from '../lib/flowTypes';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Settings, Target, CheckCircle2 } from 'lucide-react';
import { SelectorModal } from './SelectorModal';
import { detectSelectors, type DetectedElement } from '../sub_FlowSelectors/lib';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StepEditorProps {
  step: FlowStep;
  onUpdate: (stepId: string, updates: Partial<FlowStep>) => void;
  selectedSelector?: string;
  onSelectorApplied?: () => void;
  targetUrl?: string; // Flow target URL for selector scanning
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  testId?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  min?: number;
  step?: number;
  helpText?: string;
  showScanButton?: boolean;
  onScanClick?: () => void;
  scanStatus?: 'idle' | 'ready' | 'scanned';
  scanLoading?: boolean;
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  testId,
  required = false,
  className = '',
  rows,
  min,
  step,
  helpText,
  showScanButton = false,
  onScanClick,
  scanStatus = 'idle',
  scanLoading = false,
}: InputFieldProps) {
  const { currentTheme } = useTheme();
  const isTextarea = type === 'textarea';

  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text.primary,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: currentTheme.colors.border,
  };

  const baseClassName = `w-full px-3 py-2 rounded text-sm ${className}`;

  // Scan button color logic
  const getScanButtonStyle = () => {
    if (scanStatus === 'scanned') {
      return {
        backgroundColor: '#10b981' + '20',
        color: '#10b981',
        borderColor: '#10b981' + '40',
      };
    } else if (scanStatus === 'ready') {
      return {
        backgroundColor: currentTheme.colors.primary + '20',
        color: currentTheme.colors.primary,
        borderColor: currentTheme.colors.primary + '40',
      };
    } else {
      return {
        backgroundColor: currentTheme.colors.surface,
        color: currentTheme.colors.text.tertiary,
        borderColor: currentTheme.colors.border,
      };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label
          className="text-sm font-medium"
          style={{ color: currentTheme.colors.text.primary }}
        >
          {label}{required && ' *'}
        </label>
        {showScanButton && (
          <button
            onClick={onScanClick}
            disabled={scanStatus === 'idle' || scanLoading}
            className="px-2 py-1 rounded text-xs transition-all flex items-center gap-1.5"
            style={{
              ...getScanButtonStyle(),
              borderWidth: '1px',
              borderStyle: 'solid',
              opacity: scanStatus === 'idle' || scanLoading ? 0.5 : 1,
            }}
            title={scanStatus === 'scanned' ? 'Scan completed - Click to select' : 'Scan page for selectors'}
          >
            {scanLoading ? (
              <LoadingSpinner size="sm" />
            ) : scanStatus === 'scanned' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scanned</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                <span>Scan</span>
              </>
            )}
          </button>
        )}
      </div>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
          style={inputStyle}
          rows={rows || 3}
          placeholder={placeholder}
          data-testid={testId}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
          style={inputStyle}
          placeholder={placeholder}
          data-testid={testId}
          min={min}
          step={step}
        />
      )}
      {helpText && (
        <p
          className="text-xs mt-1"
          style={{ color: currentTheme.colors.text.tertiary }}
        >
          {helpText}
        </p>
      )}
    </div>
  );
}

export function StepEditor({ step, onUpdate, selectedSelector, onSelectorApplied, targetUrl }: StepEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'ready' | 'scanned'>('idle');

  // Update scan status based on targetUrl availability
  useEffect(() => {
    if (targetUrl && targetUrl.trim()) {
      if (scanStatus === 'idle') {
        setScanStatus('ready');
      }
    } else {
      setScanStatus('idle');
    }
  }, [targetUrl]);

  const handleConfigChange = (key: string, value: string | number) => {
    onUpdate(step.id, {
      config: {
        ...step.config,
        [key]: value,
      },
    });
  };

  // Apply selected selector from TestSelectors component or modal
  useEffect(() => {
    if (selectedSelector && step.config.selector !== selectedSelector) {
      handleConfigChange('selector', selectedSelector);
      // Notify parent that selector was applied to trigger autosync
      onSelectorApplied?.();
    }
  }, [selectedSelector]);

  const handleScanClick = () => {
    setIsModalOpen(true);
    if (scanStatus === 'ready') {
      setScanStatus('scanned');
    }
  };

  const handleSelectFromModal = (selector: string, element: DetectedElement) => {
    handleConfigChange('selector', selector);
    onSelectorApplied?.();
  };

  const renderConfigFields = () => {
    const fields: React.ReactElement[] = [];

    // Common fields
    fields.push(
      <InputField
        key="description"
        label="Description"
        value={step.config.description || ''}
        onChange={(value) => handleConfigChange('description', value)}
        placeholder="Step description"
        testId="step-description-input"
      />
    );

    // Type-specific fields
    switch (step.type) {
      case 'navigate':
        fields.push(
          <InputField
            key="url"
            label="URL"
            type="url"
            value={step.config.url || ''}
            onChange={(value) => handleConfigChange('url', value)}
            placeholder="https://example.com"
            testId="step-url-input"
            required
          />
        );
        break;

      case 'click':
      case 'hover':
        fields.push(
          <InputField
            key="selector"
            label="Selector"
            value={step.config.selector || ''}
            onChange={(value) => handleConfigChange('selector', value)}
            placeholder='button[data-testid="submit"]'
            testId="step-selector-input"
            className="font-mono"
            helpText="CSS selector or text content"
            required
            showScanButton
            onScanClick={handleScanClick}
            scanStatus={scanStatus}
            scanLoading={scanLoading}
          />
        );
        break;

      case 'fill':
        fields.push(
          <InputField
            key="selector"
            label="Selector"
            value={step.config.selector || ''}
            onChange={(value) => handleConfigChange('selector', value)}
            placeholder='input[name="email"]'
            testId="step-selector-input"
            className="font-mono"
            required
            showScanButton
            onScanClick={handleScanClick}
            scanStatus={scanStatus}
            scanLoading={scanLoading}
          />,
          <InputField
            key="value"
            label="Value"
            value={step.config.value || ''}
            onChange={(value) => handleConfigChange('value', value)}
            placeholder="Text to enter"
            testId="step-value-input"
            required
          />
        );
        break;

      case 'select':
        fields.push(
          <InputField
            key="selector"
            label="Selector"
            value={step.config.selector || ''}
            onChange={(value) => handleConfigChange('selector', value)}
            placeholder='select[name="country"]'
            testId="step-selector-input"
            className="font-mono"
            required
            showScanButton
            onScanClick={handleScanClick}
            scanStatus={scanStatus}
            scanLoading={scanLoading}
          />,
          <InputField
            key="value"
            label="Option Value"
            value={step.config.value || ''}
            onChange={(value) => handleConfigChange('value', value)}
            placeholder="Option to select"
            testId="step-value-input"
            required
          />
        );
        break;

      case 'assert':
        fields.push(
          <InputField
            key="assertion"
            label="Assertion"
            type="textarea"
            value={step.config.assertion || ''}
            onChange={(value) => handleConfigChange('assertion', value)}
            placeholder="Condition to verify (e.g., page title contains 'Dashboard')"
            testId="step-assertion-input"
            className="font-mono"
            rows={3}
            required
          />,
          <InputField
            key="expectedResult"
            label="Expected Result"
            value={step.config.expectedResult || ''}
            onChange={(value) => handleConfigChange('expectedResult', value)}
            placeholder="Expected outcome"
            testId="step-expected-result-input"
          />
        );
        break;

      case 'verify':
        fields.push(
          <InputField
            key="selector"
            label="Selector"
            value={step.config.selector || ''}
            onChange={(value) => handleConfigChange('selector', value)}
            placeholder='.success-message'
            testId="step-selector-input"
            className="font-mono"
            required
            showScanButton
            onScanClick={handleScanClick}
            scanStatus={scanStatus}
            scanLoading={scanLoading}
          />,
          <InputField
            key="expectedResult"
            label="Expected Text/State"
            value={step.config.expectedResult || ''}
            onChange={(value) => handleConfigChange('expectedResult', value)}
            placeholder="Expected text or leave blank to check visibility"
            testId="step-expected-result-input"
          />
        );
        break;

      case 'wait':
        fields.push(
          <InputField
            key="timeout"
            label="Timeout (ms)"
            type="number"
            value={step.config.timeout || 3000}
            onChange={(value) => handleConfigChange('timeout', parseInt(value))}
            testId="step-timeout-input"
            min={100}
            step={100}
          />,
          <InputField
            key="selector"
            label="Wait for Selector (optional)"
            value={step.config.selector || ''}
            onChange={(value) => handleConfigChange('selector', value)}
            placeholder="Leave blank for fixed delay"
            testId="step-selector-input"
            className="font-mono"
          />
        );
        break;
    }

    return fields;
  };

  return (
    <>
      <div className='py-5'>
        <ThemedCardHeader
          title={`Edit Step`}
          icon={<Settings className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="space-y-4">
            {renderConfigFields()}
          </div>
        </ThemedCardContent>
      </div>

      {/* Selector Modal */}
      {targetUrl && (
        <SelectorModal
          isOpen={isModalOpen}
          targetUrl={targetUrl}
          onClose={() => setIsModalOpen(false)}
          onSelectSelector={handleSelectFromModal}
        />
      )}
    </>
  );
}
