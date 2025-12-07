/**
 * Related Content
 * Show and link related articles
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Link2,
  Plus,
  X,
  ExternalLink,
  Search,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useArticles } from '@/hooks/useArticles';
import { CONTENT_TYPES } from '@/utils/constants';
import type { Article } from '@/types/article';

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  type: string;
  countryId: string;
  platformId: string;
  relevanceScore?: number;
}

export interface RelatedContentProps {
  currentArticleId: string;
  currentCountryId?: string;
  currentThemeId?: string;
  linkedArticles: RelatedArticle[];
  onLink: (articleId: string) => void;
  onUnlink: (articleId: string) => void;
  className?: string;
}

export function RelatedContent({
  currentArticleId,
  currentCountryId,
  currentThemeId,
  linkedArticles,
  onLink,
  onUnlink,
  className,
}: RelatedContentProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch suggested articles (same country/theme)
  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useArticles({
    countryId: currentCountryId,
    themeId: currentThemeId,
    perPage: 10,
    status: ['published'],
  });

  // Fetch search results
  const { data: searchData, isLoading: isSearching2 } = useArticles({
    search: searchQuery,
    perPage: 10,
    status: ['published'],
  });

  const suggestions = useMemo(() => {
    const articles = suggestionsData?.data || [];
    return articles
      .filter((a) => a.id !== currentArticleId)
      .filter((a) => !linkedArticles.some((l) => l.id === a.id))
      .slice(0, 5);
  }, [suggestionsData, currentArticleId, linkedArticles]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const articles = searchData?.data || [];
    return articles
      .filter((a) => a.id !== currentArticleId)
      .filter((a) => !linkedArticles.some((l) => l.id === a.id));
  }, [searchData, searchQuery, currentArticleId, linkedArticles]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Articles liés
            <Badge variant="secondary">{linkedArticles.length}</Badge>
          </CardTitle>
          {!isSearching && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearching(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {isSearching && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search results */}
            {searchQuery && (
              <div className="border rounded-lg max-h-48 overflow-auto">
                {isSearching2 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Recherche...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Aucun résultat
                  </div>
                ) : (
                  searchResults.map((article) => (
                    <ArticleSearchItem
                      key={article.id}
                      article={article}
                      onLink={() => {
                        onLink(article.id);
                        setSearchQuery('');
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Linked articles */}
        {linkedArticles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Articles liés</h4>
            {linkedArticles.map((article) => (
              <LinkedArticleItem
                key={article.id}
                article={article}
                onUnlink={() => onUnlink(article.id)}
              />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {!isSearching && suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Suggestions (même thème/pays)
            </h4>
            {isLoadingSuggestions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              suggestions.map((article) => (
                <SuggestionItem
                  key={article.id}
                  article={article}
                  onLink={() => onLink(article.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Empty state */}
        {linkedArticles.length === 0 && !isSearching && suggestions.length === 0 && (
          <div className="text-center py-6">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Aucun article lié
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setIsSearching(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArticleSearchItem({
  article,
  onLink,
}: {
  article: Article;
  onLink: () => void;
}) {
  const contentType = CONTENT_TYPES.find((t) => t.id === article.type);

  return (
    <button
      onClick={onLink}
      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 text-left border-b last:border-b-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{article.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contentType && (
            <span className="flex items-center gap-1">
              <contentType.icon
                className="w-3 h-3"
                style={{ color: contentType.color }}
              />
              {contentType.name}
            </span>
          )}
          <span>{article.countryId}</span>
        </div>
      </div>
      <Plus className="w-4 h-4 text-primary" />
    </button>
  );
}

function LinkedArticleItem({
  article,
  onUnlink,
}: {
  article: RelatedArticle;
  onUnlink: () => void;
}) {
  const contentType = CONTENT_TYPES.find((t) => t.id === article.type);

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <div className="flex-1 min-w-0">
        <Link
          to={`/content/articles/${article.id}`}
          className="text-sm font-medium truncate hover:text-primary"
        >
          {article.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contentType && (
            <span className="flex items-center gap-1">
              <contentType.icon
                className="w-3 h-3"
                style={{ color: contentType.color }}
              />
            </span>
          )}
          <span>{article.countryId}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => window.open(`/content/articles/${article.id}`, '_blank')}
      >
        <ExternalLink className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-red-600"
        onClick={onUnlink}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

function SuggestionItem({
  article,
  onLink,
}: {
  article: Article;
  onLink: () => void;
}) {
  const contentType = CONTENT_TYPES.find((t) => t.id === article.type);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{article.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contentType && (
            <span className="flex items-center gap-1">
              <contentType.icon
                className="w-3 h-3"
                style={{ color: contentType.color }}
              />
              {contentType.name}
            </span>
          )}
          <span>{article.countryId}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7"
        onClick={onLink}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default RelatedContent;
