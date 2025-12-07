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
  User,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
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
import { usePressRelease, usePressReleaseMedia } from '@/hooks/usePressReleases';
import { CardImage, HeroImage } from '@/components/ui/OptimizedImage';
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
  desktop: 'w-full max-w-4xl',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

export const PressReleasePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['press', 'common']);

  const pressReleaseId = parseInt(id!, 10);

  // State
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  // Queries
  const { data: pressRelease, isLoading } = usePressRelease(pressReleaseId);
  const { data: media } = usePressReleaseMedia(pressReleaseId);

  // Get content for selected language
  const content = useMemo(() => {
    if (!pressRelease) return null;

    if (selectedLanguage === 'fr') {
      return {
        title: pressRelease.title,
        excerpt: pressRelease.excerpt,
        content: pressRelease.content,
      };
    }

    const translation = pressRelease.translations?.find(
      (t) => t.language === selectedLanguage
    );

    if (translation) {
      return {
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
      };
    }

    return null;
  }, [pressRelease, selectedLanguage]);

  // Available languages
  const availableLanguages = useMemo(() => {
    const langs = ['fr'];
    if (pressRelease?.translations) {
      pressRelease.translations
        .filter((t) => t.status === 'completed')
        .forEach((t) => langs.push(t.language));
    }
    return SUPPORTED_LANGUAGES.filter((l) => langs.includes(l.code));
  }, [pressRelease?.translations]);

  // Platform info
  const platform = useMemo(() => {
    return PLATFORMS.find((p) => p.id === pressRelease?.platform);
  }, [pressRelease?.platform]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share && pressRelease?.publicUrl) {
      try {
        await navigator.share({
          title: content?.title,
          text: content?.excerpt,
          url: pressRelease.publicUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pressRelease || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('press:preview.notFound')}</p>
        <Button
          variant="link"
          onClick={() => navigate('/admin/press/releases')}
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
                to={`/admin/press/releases/${pressReleaseId}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common:back')}
              </Link>

              <Separator orientation="vertical" className="h-6" />

              <span className="font-medium">{t('press:preview.title')}</span>
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

              {pressRelease.publicUrl && (
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('common:share')}
                </Button>
              )}

              {pressRelease.publicUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={pressRelease.publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('press:preview.viewOnline')}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div
            className={cn(
              'bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300',
              DEVICE_WIDTHS[device]
            )}
          >
            {/* Press Release Header */}
            <div className="p-8 border-b">
              {/* Platform Badge */}
              {platform && (
                <Badge variant="outline" className="mb-4">
                  {platform.name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold mb-4">{content.title}</h1>

              {/* Excerpt */}
              {content.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">{content.excerpt}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {pressRelease.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(pressRelease.publishedAt), 'PPP', { locale: fr })}
                  </div>
                )}

                {pressRelease.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {pressRelease.author}
                  </div>
                )}

                {media && media.length > 0 && (
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    {media.length} {t('press:preview.media')}
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image */}
            {pressRelease.featuredImage && (
              <div className="relative aspect-video">
                <HeroImage
                  src={pressRelease.featuredImage}
                  alt={content.title}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-8">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </div>

            {/* Media Gallery */}
            {media && media.length > 0 && (
              <div className="p-8 border-t">
                <h2 className="text-xl font-semibold mb-4">{t('press:preview.mediaGallery')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden">
                      <CardImage
                        src={item.url}
                        alt={item.alt || ''}
                        className="w-full h-full"
                      />
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-sm">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
          .prose {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PressReleasePreview;
