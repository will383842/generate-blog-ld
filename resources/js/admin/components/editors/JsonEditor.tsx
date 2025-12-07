import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeEditor } from './CodeEditor';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { CheckCircle, AlertCircle, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JsonEditorProps {
  value: string | object;
  onChange?: (value: string, parsed: object | null) => void;
  readOnly?: boolean;
  showValidation?: boolean;
  showFormatButton?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  showValidation = true,
  showFormatButton = true,
  minHeight = 200,
  maxHeight = 500,
  className,
  placeholder = '{\n  \n}',
}: JsonEditorProps) {
  const { t } = useTranslation('common');
  
  const [stringValue, setStringValue] = useState<string>(() => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const newValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (newValue !== stringValue) {
      setStringValue(newValue);
      validateJson(newValue);
    }
  }, [value]);

  const validateJson = useCallback((json: string): object | null => {
    if (!json.trim()) {
      setError(null);
      setIsValid(true);
      return null;
    }
    
    try {
      const parsed = JSON.parse(json);
      setError(null);
      setIsValid(true);
      return parsed;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON';
      setError(errorMessage);
      setIsValid(false);
      return null;
    }
  }, []);

  const handleChange = (newValue: string) => {
    setStringValue(newValue);
    const parsed = validateJson(newValue);
    onChange?.(newValue, parsed);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(stringValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setStringValue(formatted);
      setError(null);
      setIsValid(true);
      onChange?.(formatted, parsed);
    } catch (e) {
      // Already invalid
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(showFormatButton || showValidation) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showValidation && (
              <div className="flex items-center gap-1.5 text-sm">
                {isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Valid JSON</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Invalid JSON</span>
                  </>
                )}
              </div>
            )}
          </div>
          {showFormatButton && !readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormat}
              disabled={!isValid}
            >
              <Wand2 className="h-3.5 w-3.5 mr-1" />
              Format
            </Button>
          )}
        </div>
      )}

      <CodeEditor
        value={stringValue}
        onChange={handleChange}
        language="json"
        readOnly={readOnly}
        minHeight={minHeight}
        maxHeight={maxHeight}
        placeholder={placeholder}
        showLanguageSelector={false}
      />

      {error && showValidation && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-mono text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default JsonEditor;
