import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  showLanguageSelector?: boolean;
  showCopyButton?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
  languages?: string[];
  onLanguageChange?: (language: string) => void;
}

const defaultLanguages = [
  'javascript',
  'typescript',
  'json',
  'html',
  'css',
  'python',
  'php',
  'sql',
  'markdown',
  'yaml',
];

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  showLineNumbers = true,
  showLanguageSelector = false,
  showCopyButton = true,
  minHeight = 200,
  maxHeight = 500,
  className,
  placeholder = '// Enter code here...',
  languages = defaultLanguages,
  onLanguageChange,
}: CodeEditorProps) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lines = value.split('\n');
  const lineCount = lines.length;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange?.(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-muted/30 overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 bg-background',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {showLanguageSelector ? (
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showCopyButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              title={t('actions.copy')}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div
        className="flex overflow-auto"
        style={{
          minHeight: isFullscreen ? 'calc(100% - 41px)' : minHeight,
          maxHeight: isFullscreen ? 'calc(100% - 41px)' : maxHeight,
        }}
      >
        {showLineNumbers && (
          <div className="flex-none py-3 px-2 text-right text-xs text-muted-foreground font-mono bg-muted/30 select-none border-r">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="leading-5">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className={cn(
            'flex-1 p-3 bg-transparent font-mono text-sm leading-5 resize-none outline-none',
            'placeholder:text-muted-foreground/50',
            readOnly && 'cursor-default'
          )}
          style={{
            minHeight: isFullscreen ? '100%' : minHeight - 41,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
