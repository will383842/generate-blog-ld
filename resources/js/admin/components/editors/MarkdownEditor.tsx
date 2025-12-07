import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showPreview?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}

const toolbarActions: ToolbarAction[] = [
  { icon: <Bold className="h-4 w-4" />, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: <Italic className="h-4 w-4" />, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: <Strikethrough className="h-4 w-4" />, label: 'Strikethrough', prefix: '~~', suffix: '~~' },
  { icon: <Heading1 className="h-4 w-4" />, label: 'Heading 1', prefix: '# ', block: true },
  { icon: <Heading2 className="h-4 w-4" />, label: 'Heading 2', prefix: '## ', block: true },
  { icon: <List className="h-4 w-4" />, label: 'Bullet List', prefix: '- ', block: true },
  { icon: <ListOrdered className="h-4 w-4" />, label: 'Numbered List', prefix: '1. ', block: true },
  { icon: <Quote className="h-4 w-4" />, label: 'Quote', prefix: '> ', block: true },
  { icon: <Code className="h-4 w-4" />, label: 'Code', prefix: '`', suffix: '`' },
  { icon: <Link className="h-4 w-4" />, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: <Image className="h-4 w-4" />, label: 'Image', prefix: '![alt](', suffix: ')' },
];

const renderMarkdown = (markdown: string): string => {
  return markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-muted pl-4 italic my-2">$1</blockquote>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br />');
};

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  showToolbar = true,
  showPreview = true,
  minHeight = 300,
  maxHeight = 600,
  className,
  placeholder = 'Write your content in Markdown...',
}: MarkdownEditorProps) {
  const { t } = useTranslation('content');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyFormat = (action: ToolbarAction) => {
    if (!textareaRef.current || readOnly) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText: string;
    let newCursorPos: number;

    if (action.block) {
      const beforeSelection = value.substring(0, start);
      const lineStart = beforeSelection.lastIndexOf('\n') + 1;
      newText = value.substring(0, lineStart) + action.prefix + value.substring(lineStart);
      newCursorPos = start + action.prefix.length;
    } else {
      newText = value.substring(0, start) + action.prefix + selectedText + (action.suffix || '') + value.substring(end);
      newCursorPos = end + action.prefix.length + (action.suffix?.length || 0);
    }

    onChange?.(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      {showToolbar && !readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => applyFormat(action)}
              title={action.label}
            >
              {action.icon}
            </Button>
          ))}
        </div>
      )}

      {showPreview ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
          <TabsList className="mx-2 mt-2">
            <TabsTrigger value="write" className="gap-1">
              <Edit3 className="h-3.5 w-3.5" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-0">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              readOnly={readOnly}
              placeholder={placeholder}
              className="w-full p-4 bg-transparent font-mono text-sm resize-none outline-none"
              style={{ minHeight: minHeight - 90, maxHeight: maxHeight - 90 }}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div
              className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
              style={{ minHeight: minHeight - 90, maxHeight: maxHeight - 90 }}
              dangerouslySetInnerHTML={{ __html: `<p class="my-2">${renderMarkdown(value)}</p>` }}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent font-mono text-sm resize-none outline-none"
          style={{ minHeight: minHeight - 50, maxHeight: maxHeight - 50 }}
        />
      )}
    </div>
  );
}

export default MarkdownEditor;
