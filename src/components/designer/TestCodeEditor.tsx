'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Copy, Download, Save, Edit3, Check } from 'lucide-react';

interface TestCodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  readOnly?: boolean;
  language?: string;
}

export function TestCodeEditor({
  code,
  onChange,
  onSave,
  readOnly = false,
  language = 'typescript',
}: TestCodeEditorProps) {
  const { themeId } = useTheme();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [currentCode, setCurrentCode] = useState(code);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test.spec.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentCode);
    }
    setIsEditing(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCurrentCode(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Generated Test Code"
        subtitle="Playwright TypeScript test suite"
        icon={<Edit3 className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {!readOnly && (
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'View Only' : 'Edit'}
              </ThemedButton>
            )}
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </ThemedButton>
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </ThemedButton>
            {!readOnly && isEditing && onSave && (
              <ThemedButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save
              </ThemedButton>
            )}
          </div>
        }
      />
      <ThemedCardContent>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--theme-border)' }}>
          <Editor
            height="600px"
            language={language}
            value={currentCode}
            onChange={handleEditorChange}
            theme={themeId === 'cyber' || themeId === 'crimson' || themeId === 'slate' ? 'vs-dark' : 'vs-light'}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
