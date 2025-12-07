import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Printer,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  Layers,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useDossier, useDossierSections } from '@/hooks/useDossiers';
import { HeroImage } from '@/components/ui/OptimizedImage';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Les 9 langues supportées
const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: 'w-full max-w-5xl',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

export const DossierPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['press', 'common']);

  const dossierId = parseInt(id!, 10);

  // State
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Queries
  const { data: dossier, isLoading } = useDossier(dossierId);
  const { data: sections } = useDossierSections(dossierId);

  // Get content for selected language
  const content = useMemo(() => {
    if (!dossier) return null;

    if (selectedLanguage === 'fr') {
      return {
        title: dossier.title,
        excerpt: dossier.excerpt,
      };
    }

    const translation = dossier.translations?.find(
      (t) => t.language === selectedLanguage
    );

    if (translation) {
      return {
        title: translation.title,
        excerpt: translation.excerpt,
      };
    }

    return null;
  }, [dossier, selectedLanguage]);

  // Available languages
  const availableLanguages = useMemo(() => {
    const langs = ['fr'];
    if (dossier?.translations) {
      dossier.translations
        .filter((t) => t.status === 'completed')
        .forEach((t) => langs.push(t.language));
    }
    return SUPPORTED_LANGUAGES.filter((l) => langs.includes(l.code));
  }, [dossier?.translations]);

  // Platform info
  const platform = useMemo(() => {
    return PLATFORMS.find((p) => p.id === dossier?.platform);
  }, [dossier?.platform]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share && dossier?.publicUrl) {
      try {
        await navigator.share({
          title: content?.title,
          text: content?.excerpt,
          url: dossier.publicUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId: number) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dossier || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('press:preview.notFound')}</p>
        <Button
          variant="link"
          onClick={() => navigate('/admin/press/dossiers')}
          className="mt-2"
        >
          {t('common:back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header Toolbar */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <Link
                to={`/admin/press/dossiers/${dossierId}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common:back')}
              </Link>

              <Separator orientation="vertical" className="h-6" />

              <span className="font-medium">{t('press:preview.dossierTitle')}</span>
            </div>

            {/* Center: Device Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={device === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={device === 'tablet' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDevice('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={device === 'mobile' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              {availableLanguages.length > 1 && (
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-[140px]">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                {t('common:print')}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('common:export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>PDF</DropdownMenuItem>
                  <DropdownMenuItem>Word</DropdownMenuItem>
                  <DropdownMenuItem>HTML</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {dossier.publicUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('common:share')}
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <a href={dossier.publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('press:preview.viewOnline')}
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Container with Sidebar TOC */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6 justify-center">
          {/* Table of Contents Sidebar */}
          {device === 'desktop' && sections && sections.length > 0 && (
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-24 bg-background rounded-lg border p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t('press:preview.contents')}
                </h3>
                <ScrollArea className="h-[400px]">
                  <nav className="space-y-1">
                    {sections.map((section, index) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <span className="text-muted-foreground text-xs">
                          {index + 1}.
                        </span>
                        <span className="truncate">{section.title}</span>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 ml-auto transition-transform',
                            activeSection === section.id && 'rotate-90'
                          )}
                        />
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Preview Content */}
          <div
            className={cn(
              'bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300',
              DEVICE_WIDTHS[device]
            )}
          >
            {/* Dossier Header */}
            <div className="p-8 border-b bg-gradient-to-b from-primary/5 to-transparent">
              {/* Platform Badge */}
              {platform && (
                <Badge variant="outline" className="mb-4">
                  {platform.name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-4xl font-bold mb-4">{content.title}</h1>

              {/* Excerpt */}
              {content.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">{content.excerpt}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {dossier.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(dossier.publishedAt), 'PPP', { locale: fr })}
                  </div>
                )}

                {sections && sections.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {sections.length} {t('press:preview.sections')}
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image */}
            {dossier.featuredImage && (
              <div className="relative aspect-video">
                <HeroImage
                  src={dossier.featuredImage}
                  alt={content.title}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Table of Contents (inline for tablet/mobile) */}
            {device !== 'desktop' && sections && sections.length > 0 && (
              <div className="p-6 border-b bg-muted/30">
                <h3 className="font-medium mb-3">{t('press:preview.contents')}</h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#section-${section.id}`}
                      className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {index + 1}. {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Sections Content */}
            {sections && sections.length > 0 && (
              <div className="divide-y">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className="p-8 scroll-mt-20"
                  >
                    <h2 className="text-2xl font-bold mb-4">
                      <span className="text-muted-foreground mr-2">{index + 1}.</span>
                      {section.title}
                    </h2>

                    {section.content && (
                      <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    )}

                    {/* Section type specific content */}
                    {section.type === 'quote' && section.config?.author && (
                      <blockquote className="border-l-4 border-primary pl-4 my-4 italic">
                        <p className="text-lg">{section.content}</p>
                        <footer className="text-sm text-muted-foreground mt-2">
                          — {section.config.author}
                        </footer>
                      </blockquote>
                    )}

                    {section.type === 'gallery' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {/* Gallery images would be rendered here */}
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                          {t('press:preview.galleryPlaceholder')}
                        </div>
                      </div>
                    )}

                    {section.type === 'statistics' && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                        {t('press:preview.statisticsPlaceholder')}
                      </div>
                    )}

                    {section.type === 'chart' && (
                      <div className="mt-4 aspect-video bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">
                        {t('press:preview.chartPlaceholder')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="p-8 border-t bg-muted/30">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">{t('press:preview.contact')}</p>
                <p>press@{platform?.domain || 'example.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prose, .prose * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default DossierPreview;
