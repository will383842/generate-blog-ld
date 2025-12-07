/**
 * FAQ Editor
 * Drag & drop FAQ management
 */

import { useState } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import type { ArticleFaq } from '@/types/article';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface FaqEditorProps {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
  maxFaqs?: number;
  className?: string;
}

export function FaqEditor({
  faqs,
  onChange,
  maxFaqs = 20,
  className,
}: FaqEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const addFaq = () => {
    if (faqs.length >= maxFaqs) return;

    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      order: faqs.length,
    };

    onChange([...faqs, newFaq]);
    setExpandedIds(new Set([...expandedIds, newFaq.id]));
  };

  const updateFaq = (id: string, updates: Partial<FaqItem>) => {
    onChange(
      faqs.map((faq) => (faq.id === id ? { ...faq, ...updates } : faq))
    );
  };

  const deleteFaq = (id: string) => {
    onChange(faqs.filter((faq) => faq.id !== id));
    expandedIds.delete(id);
    setExpandedIds(new Set(expandedIds));
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = faqs.findIndex((f) => f.id === draggedId);
    const targetIndex = faqs.findIndex((f) => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFaqs = [...faqs];
    const [removed] = newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(targetIndex, 0, removed);

    // Update order values
    newFaqs.forEach((faq, index) => {
      faq.order = index;
    });

    onChange(newFaqs);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const moveUp = (id: string) => {
    const index = faqs.findIndex((f) => f.id === id);
    if (index <= 0) return;

    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    newFaqs.forEach((faq, i) => (faq.order = i));
    onChange(newFaqs);
  };

  const moveDown = (id: string) => {
    const index = faqs.findIndex((f) => f.id === id);
    if (index === -1 || index >= faqs.length - 1) return;

    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    newFaqs.forEach((faq, i) => (faq.order = i));
    onChange(newFaqs);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Questions fréquentes</h3>
          <p className="text-sm text-muted-foreground">
            {faqs.length} / {maxFaqs} questions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addFaq}
          disabled={faqs.length >= maxFaqs}
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* FAQ List */}
      {faqs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Aucune FAQ</p>
            <Button onClick={addFaq}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isExpanded = expandedIds.has(faq.id);
            const isDragging = draggedId === faq.id;

            return (
              <div
                key={faq.id}
                draggable
                onDragStart={() => handleDragStart(faq.id)}
                onDragOver={(e) => handleDragOver(e, faq.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'border rounded-lg bg-white transition-shadow',
                  isDragging && 'opacity-50 shadow-lg'
                )}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer"
                  onClick={() => toggleExpand(faq.id)}
                >
                  {/* Drag handle */}
                  <div
                    className="cursor-grab hover:bg-gray-100 p-1 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Order */}
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}.
                  </span>

                  {/* Question preview */}
                  <span className="flex-1 font-medium truncate">
                    {faq.question || 'Question sans titre'}
                  </span>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveUp(faq.id)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveDown(faq.id)}
                      disabled={index === faqs.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                      onClick={() => deleteFaq(faq.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expand/collapse */}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t pt-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question
                      </label>
                      <Input
                        value={faq.question}
                        onChange={(e) =>
                          updateFaq(faq.id, { question: e.target.value })
                        }
                        placeholder="Entrez la question..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Réponse
                      </label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) =>
                          updateFaq(faq.id, { answer: e.target.value })
                        }
                        placeholder="Entrez la réponse..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FaqEditor;
