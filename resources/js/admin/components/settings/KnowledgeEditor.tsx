import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Save, X } from 'lucide-react';

interface KnowledgeItem {
  id?: number;
  key: string;
  value: string;
  type: string;
  category?: string;
  tags?: string[];
}

interface KnowledgeEditorProps {
  item: KnowledgeItem;
  onChange: (item: KnowledgeItem) => void;
  onSave?: (item: KnowledgeItem) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function KnowledgeEditor({
  item,
  onChange,
  onSave,
  onCancel,
  isLoading,
}: KnowledgeEditorProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !item.tags?.includes(newTag.trim())) {
      onChange({
        ...item,
        tags: [...(item.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange({
      ...item,
      tags: item.tags?.filter((t) => t !== tag),
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cle
          </label>
          <Input
            value={item.key}
            onChange={(e) => onChange({ ...item, key: e.target.value })}
            placeholder="ex: company_name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valeur
          </label>
          <Textarea
            value={item.value}
            onChange={(e) => onChange({ ...item, value: e.target.value })}
            placeholder="Contenu de la connaissance..."
            rows={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {item.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ajouter un tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Ajouter
            </Button>
          </div>
        </div>

        {(onSave || onCancel) && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            {onSave && (
              <Button onClick={() => onSave(item)} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default KnowledgeEditor;
