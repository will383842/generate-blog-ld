/**
 * Payload Preview Component
 * File 385 - JSON payload preview with syntax highlighting and field mapping
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Maximize2,
  Minimize2,
  Code,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { FieldMapping } from '@/types/publishing';
import { cn } from '@/lib/utils';

// JSON syntax highlighting
function highlightJson(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  return lines.map((line, index) => {
    // Highlight keys
    let highlighted = line.replace(
      /"([^"]+)":/g,
      '<span class="text-purple-600">"$1"</span>:'
    );
    // Highlight strings
    highlighted = highlighted.replace(
      /: "([^"]*)"/g,
      ': <span class="text-green-600">"$1"</span>'
    );
    // Highlight numbers
    highlighted = highlighted.replace(
      /: (\d+)/g,
      ': <span class="text-blue-600">$1</span>'
    );
    // Highlight booleans
    highlighted = highlighted.replace(
      /: (true|false)/g,
      ': <span class="text-orange-600">$1</span>'
    );
    // Highlight null
    highlighted = highlighted.replace(
      /: (null)/g,
      ': <span class="text-gray-500">$1</span>'
    );

    return (
      <div key={index} className="flex">
        <span className="text-gray-400 select-none w-8 text-right pr-2 flex-shrink-0">
          {index + 1}
        </span>
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  });
}

// Diff view for modified payloads
function renderDiff(original: string, modified: string): React.ReactNode {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Original</p>
        <div className="font-mono text-xs bg-red-50 p-3 rounded border">
          {originalLines.map((line, i) => (
            <div key={i} className={cn(
              modifiedLines[i] !== line && 'bg-red-100'
            )}>
              {line}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Modifié</p>
        <div className="font-mono text-xs bg-green-50 p-3 rounded border">
          {modifiedLines.map((line, i) => (
            <div key={i} className={cn(
              originalLines[i] !== line && 'bg-green-100'
            )}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PayloadPreviewProps {
  payload: Record<string, any>;
  originalPayload?: Record<string, any>;
  fieldMapping?: FieldMapping[];
  title?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  expandable?: boolean;
}

export function PayloadPreview({
  payload,
  originalPayload,
  fieldMapping,
  title = 'Payload',
  maxHeight = '400px',
  showLineNumbers = true,
  expandable = true,
}: PayloadPreviewProps) {
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'mapping' | 'diff'>('json');

  // Format JSON
  const formattedJson = useMemo(() => {
    return JSON.stringify(payload, null, 2);
  }, [payload]);

  const formattedOriginal = useMemo(() => {
    return originalPayload ? JSON.stringify(originalPayload, null, 2) : '';
  }, [originalPayload]);

  // Check if modified
  const isModified = originalPayload && formattedJson !== formattedOriginal;

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render field mapping visualization
  const renderFieldMapping = () => {
    if (!fieldMapping || fieldMapping.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun mapping configuré
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {fieldMapping.map((mapping, index) => {
          const sourceValue = payload[mapping.sourceField];
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{mapping.sourceField}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {typeof sourceValue === 'object'
                    ? JSON.stringify(sourceValue).slice(0, 50)
                    : String(sourceValue || '-').slice(0, 50)
                  }
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium font-mono">{mapping.targetPath}</p>
                {mapping.transform && mapping.transform !== 'none' && (
                  <Badge variant="outline" className="text-xs">
                    {mapping.transform}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className="space-y-2">
      {/* Tabs if mapping or diff available */}
      {(fieldMapping || isModified) ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'json' | 'mapping' | 'diff')}>
          <TabsList>
            <TabsTrigger value="json" className="gap-1">
              <Code className="h-3 w-3" />
              JSON
            </TabsTrigger>
            {fieldMapping && (
              <TabsTrigger value="mapping" className="gap-1">
                <ArrowRight className="h-3 w-3" />
                Mapping
              </TabsTrigger>
            )}
            {isModified && (
              <TabsTrigger value="diff" className="gap-1">
                <Eye className="h-3 w-3" />
                Diff
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="json" className="mt-2">
            <ScrollArea style={{ height: expanded ? '60vh' : maxHeight }}>
              <div className="font-mono text-xs leading-5">
                {showLineNumbers ? highlightJson(formattedJson) : (
                  <pre>{formattedJson}</pre>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          {fieldMapping && (
            <TabsContent value="mapping" className="mt-2">
              <ScrollArea style={{ height: expanded ? '60vh' : maxHeight }}>
                {renderFieldMapping()}
              </ScrollArea>
            </TabsContent>
          )}
          {isModified && (
            <TabsContent value="diff" className="mt-2">
              <ScrollArea style={{ height: expanded ? '60vh' : maxHeight }}>
                {renderDiff(formattedOriginal, formattedJson)}
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <ScrollArea style={{ height: expanded ? '60vh' : maxHeight }}>
          <div className="font-mono text-xs leading-5">
            {showLineNumbers ? highlightJson(formattedJson) : (
              <pre>{formattedJson}</pre>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4" />
            {title}
            {isModified && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Modifié
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {expandable && (
              <Dialog open={expanded} onOpenChange={setExpanded}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                  </DialogHeader>
                  {content}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!expanded && content}
      </CardContent>
    </Card>
  );
}

// Compact inline preview
interface InlinePayloadPreviewProps {
  payload: Record<string, any>;
  maxLength?: number;
}

export function InlinePayloadPreview({ payload, maxLength = 100 }: InlinePayloadPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(payload);
  const truncated = json.length > maxLength;

  return (
    <div className="font-mono text-xs">
      {expanded ? (
        <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : (
        <span className="text-muted-foreground">
          {truncated ? json.slice(0, maxLength) + '...' : json}
        </span>
      )}
      {truncated && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Réduire
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3 mr-1" />
              Voir tout
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default PayloadPreview;
