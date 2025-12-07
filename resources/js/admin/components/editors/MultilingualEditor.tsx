/**
 * Multilingual Editor
 * Tabbed editor for multiple language versions
 */

import { useState, useCallback } from 'react';
import { Copy, Languages, Wand2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TipTapEditor } from './TipTapEditor';
import { LANGUAGES } from '@/utils/constants';
import type { LanguageCode } from '@/types/program';
import type { TranslationStatus } from '@/types/article';

export interface LanguageContent {
  languageId: LanguageCode;
  content: string;
  status: TranslationStatus;
  lastModified?: Date;
}

export interface MultilingualEditorProps {
  contents: LanguageContent[];
  onChange: (languageId: LanguageCode, content: string) => void;
  onTranslate?: (targetLanguageId: LanguageCode, useAI: boolean) => void;
  onCopyFrom?: (fromLanguageId: LanguageCode, toLanguageId: LanguageCode) => void;
  onSaveAll?: () => void;
  availableLanguages?: LanguageCode[];
  primaryLanguage?: LanguageCode;
  syncScroll?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<TranslationStatus, { label: string; color: string; icon: typeof Check }> = {
  missing: { label: 'Manquant', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Languages },
  done: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: Check },
  needs_update: { label: 'À mettre à jour', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export function MultilingualEditor({
  contents,
  onChange,
  onTranslate,
  onCopyFrom,
  onSaveAll,
  availableLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'],
  primaryLanguage = 'fr',
  syncScroll = false,
  className,
}: MultilingualEditorProps) {
  const [activeTab, setActiveTab] = useState<LanguageCode>(primaryLanguage);
  const [isTranslating, setIsTranslating] = useState<LanguageCode | null>(null);

  // Get content for a language
  const getContent = useCallback((languageId: LanguageCode) => {
    return contents.find((c) => c.languageId === languageId)?.content || '';
  }, [contents]);

  // Get status for a language
  const getStatus = useCallback((languageId: LanguageCode) => {
    return contents.find((c) => c.languageId === languageId)?.status || 'missing';
  }, [contents]);

  // Get language info
  const getLanguageInfo = (code: LanguageCode) => {
    return LANGUAGES.find((l) => l.code === code);
  };

  // Handle translation
  const handleTranslate = async (targetLanguageId: LanguageCode, useAI: boolean) => {
    if (!onTranslate) return;
    
    setIsTranslating(targetLanguageId);
    try {
      await onTranslate(targetLanguageId, useAI);
    } finally {
      setIsTranslating(null);
    }
  };

  // Handle copy from another language
  const handleCopyFrom = (fromLanguageId: LanguageCode) => {
    if (!onCopyFrom) return;
    onCopyFrom(fromLanguageId, activeTab);
  };

  // Languages with content
  const languagesWithContent = availableLanguages.filter(
    (l) => getContent(l).length > 0
  );

  // Progress
  const completedCount = contents.filter((c) => c.status === 'done').length;
  const totalCount = availableLanguages.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Traductions</p>
            <p className="text-xs text-muted-foreground">
              {completedCount} / {totalCount} langues complétées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {onSaveAll && (
            <Button variant="outline" size="sm" onClick={onSaveAll}>
              Sauvegarder tout
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LanguageCode)}>
        <div className="flex items-center justify-between">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {availableLanguages.map((code) => {
              const lang = getLanguageInfo(code);
              const status = getStatus(code);
              const statusConfig = STATUS_CONFIG[status];

              return (
                <TabsTrigger
                  key={code}
                  value={code}
                  className="gap-2 px-3 py-1.5"
                >
                  <span>{lang?.flag}</span>
                  <span>{lang?.code.toUpperCase()}</span>
                  <Badge
                    variant="secondary"
                    className={cn('h-5 px-1.5', statusConfig.color)}
                  >
                    <statusConfig.icon className="w-3 h-3" />
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Actions for current tab */}
          <div className="flex items-center gap-2">
            {/* Copy from */}
            {onCopyFrom && languagesWithContent.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-1" />
                    Copier depuis
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {languagesWithContent
                    .filter((l) => l !== activeTab)
                    .map((code) => {
                      const lang = getLanguageInfo(code);
                      return (
                        <DropdownMenuItem
                          key={code}
                          onClick={() => handleCopyFrom(code)}
                        >
                          {lang?.flag} {lang?.name}
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auto-translate */}
            {onTranslate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTranslate(activeTab, true)}
                disabled={isTranslating === activeTab}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                {isTranslating === activeTab ? 'Traduction...' : 'Traduire'}
              </Button>
            )}
          </div>
        </div>

        {/* Editor for each language */}
        {availableLanguages.map((code) => (
          <TabsContent key={code} value={code} className="mt-4">
            <TipTapEditor
              content={getContent(code)}
              onChange={(content) => onChange(code, content)}
              placeholder={`Contenu en ${getLanguageInfo(code)?.name}...`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default MultilingualEditor;
