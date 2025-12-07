/**
 * Article Preview Page
 * Responsive preview with device toggle
 */

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Share2,
  Edit,
  ExternalLink,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CardImage } from '@/components/ui/OptimizedImage';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useArticle } from '@/hooks/useArticles';
import { LANGUAGES, PLATFORMS } from '@/utils/constants';
import type { LanguageCode } from '@/types/program';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 1200, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export function ArticlePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [language, setLanguage] = useState<LanguageCode>('fr');
  const [copied, setCopied] = useState(false);

  const { data: articleData, isLoading } = useArticle(id || '');
  const article = articleData?.data;

  // Get content for current language
  const content = useMemo(() => {
    if (!article) return '';
    if (article.languageId === language) return article.content;
    const translation = article.translations?.find((t) => t.languageId === language);
    return translation?.content || article.content;
  }, [article, language]);

  // Available languages
  const availableLanguages = useMemo(() => {
    if (!article) return [];
    const langs = [article.languageId];
    article.translations?.forEach((t) => {
      if (t.status === 'done') langs.push(t.languageId);
    });
    return langs;
  }, [article]);

  const handleCopyLink = () => {
    const url = `https://example.com/${article?.slug || ''}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.excerpt,
        url: `https://example.com/${article?.slug}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Article non trouvé</p>
      </div>
    );
  }

  const platform = PLATFORMS.find((p) => p.id === article.platformId);
  const deviceSize = DEVICE_SIZES[device];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/content/articles/${id}`}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{article.title}</h1>
              <p className="text-xs text-muted-foreground">
                {platform?.name} • {article.countryId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Device Toggle */}
            <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceType)}>
              <TabsList>
                <TabsTrigger value="desktop">
                  <Monitor className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="tablet">
                  <Tablet className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Language Select */}
            <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((code) => {
                  const lang = LANGUAGES.find((l) => l.code === code);
                  return (
                    <SelectItem key={code} value={code}>
                      {lang?.flag} {lang?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copié!' : 'Copier le lien'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button size="sm" asChild>
              <Link to={`/content/articles/${id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-center">
          {/* Device Frame */}
          <div
            className={cn(
              'bg-white shadow-lg transition-all duration-300',
              device === 'mobile' && 'rounded-3xl',
              device === 'tablet' && 'rounded-2xl',
              device === 'desktop' && 'rounded-lg'
            )}
            style={{
              width: deviceSize.width,
              maxWidth: '100%',
            }}
          >
            {/* Browser Chrome (Desktop only) */}
            {device === 'desktop' && (
              <div className="bg-gray-200 px-4 py-2 rounded-t-lg flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded px-3 py-1 text-xs text-muted-foreground truncate">
                    https://example.com/{article.slug}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-auto"
              style={{
                height: device === 'desktop' ? deviceSize.height - 40 : deviceSize.height,
              }}
            >
              <article className="p-6 md:p-10">
                {/* Article Header */}
                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge>{article.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(article.createdAt), 'PPP', { locale: fr })}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {article.title}
                  </h1>
                  {article.excerpt && (
                    <p className="text-lg text-muted-foreground">
                      {article.excerpt}
                    </p>
                  )}
                </header>

                {/* Featured Image */}
                {article.imageUrl && (
                  <figure className="mb-8">
                    <CardImage
                      src={article.imageUrl}
                      alt={article.imageAlt || article.title}
                      className="w-full rounded-lg"
                    />
                    {article.imageAttribution && (
                      <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                        {article.imageAttribution}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Content */}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* FAQs */}
                {article.faqs && article.faqs.length > 0 && (
                  <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
                    <div className="space-y-4">
                      {article.faqs.map((faq) => (
                        <details
                          key={faq.id}
                          className="border rounded-lg p-4 group"
                        >
                          <summary className="font-medium cursor-pointer">
                            {faq.question}
                          </summary>
                          <p className="mt-2 text-muted-foreground">
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sources */}
                {article.sources && article.sources.length > 0 && (
                  <section className="mt-12 pt-8 border-t">
                    <h3 className="text-lg font-semibold mb-4">Sources</h3>
                    <ul className="space-y-2">
                      {article.sources.map((source) => (
                        <li key={source.id}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {source.title}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Preview */}
      <div className="bg-white border-t p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Aperçu Google</span>
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-green-700 truncate">
                https://example.com/{article.slug}
              </p>
              <p className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {article.metaTitle || article.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {article.metaDescription || article.excerpt || 'Aucune meta description'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ArticlePreviewPage;
