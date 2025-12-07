/**
 * TipTap Editor
 * Full WYSIWYG editor with extensions
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Maximize2, Minimize2, Save, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditorToolbar } from './EditorToolbar';

export interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (content: string) => void;
  editable?: boolean;
  className?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Commencez à écrire...',
  autoSave = false,
  autoSaveInterval = 30000,
  onAutoSave,
  editable = true,
  className,
}: TipTapEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setHasUnsavedChanges(true);
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !onAutoSave || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      if (editor) {
        onAutoSave(editor.getHTML());
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, autoSaveInterval, onAutoSave, editor, hasUnsavedChanges]);

  // Word count
  const wordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0;

  // Character count
  const charCount = editor ? editor.state.doc.textContent.length : 0;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  if (!editor) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-white',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Toolbar */}
      <div className="border-b bg-gray-50 sticky top-0 z-10">
        <EditorToolbar editor={editor} />
        
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t bg-white text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {wordCount} mots
            </span>
            <span>{charCount} caractères</span>
          </div>
          
          <div className="flex items-center gap-3">
            {autoSave && (
              <>
                {hasUnsavedChanges ? (
                  <Badge variant="outline" className="text-yellow-600">
                    Non enregistré
                  </Badge>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Save className="w-3 h-3" />
                    Enregistré à {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-4',
          isFullscreen ? 'h-[calc(100vh-120px)] overflow-auto' : 'min-h-[300px]',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:min-h-[200px]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          // Table styles
          '[&_.ProseMirror_table]:border-collapse',
          '[&_.ProseMirror_table]:border',
          '[&_.ProseMirror_table_td]:border',
          '[&_.ProseMirror_table_th]:border',
          '[&_.ProseMirror_table_td]:p-2',
          '[&_.ProseMirror_table_th]:p-2',
          '[&_.ProseMirror_table_th]:bg-gray-100',
        )}
      />
    </div>
  );
}

export default TipTapEditor;
