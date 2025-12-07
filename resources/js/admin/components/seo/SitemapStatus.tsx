import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Globe,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IndexStatus = 'indexed' | 'pending' | 'error' | 'excluded';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  indexStatus?: IndexStatus;
}

export interface SitemapData {
  url: string;
  lastGenerated?: string;
  urlCount: number;
  indexedCount: number;
  pendingCount: number;
  errorCount: number;
  urls?: SitemapUrl[];
}

export interface SearchEngineStatus {
  name: string;
  lastPing?: string;
  status: 'success' | 'error' | 'pending';
  indexedUrls?: number;
}

export interface SitemapStatusProps {
  sitemap: SitemapData;
  searchEngines?: SearchEngineStatus[];
  onRegenerate?: () => Promise<void>;
  onPingSearchEngines?: () => Promise<void>;
  onSubmitToGoogle?: () => Promise<void>;
  showUrls?: boolean;
  maxUrls?: number;
  loading?: boolean;
  className?: string;
}

const indexStatusConfig: Record<
  IndexStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  indexed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
    label: 'Indexed',
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-500',
    label: 'Pending',
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-500',
    label: 'Error',
  },
  excluded: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-gray-500',
    label: 'Excluded',
  },
};

export function SitemapStatus({
  sitemap,
  searchEngines = [],
  onRegenerate,
  onPingSearchEngines,
  onSubmitToGoogle,
  showUrls = false,
  maxUrls = 20,
  loading = false,
  className,
}: SitemapStatusProps) {
  const { t } = useTranslation('seo');
  const [regenerating, setRegenerating] = React.useState(false);
  const [pinging, setPinging] = React.useState(false);

  const indexedPercent = Math.round(
    (sitemap.indexedCount / sitemap.urlCount) * 100
  ) || 0;

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  const handlePing = async () => {
    if (!onPingSearchEngines) return;
    setPinging(true);
    try {
      await onPingSearchEngines();
    } finally {
      setPinging(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('sitemap.title')}
            </CardTitle>
            <div className="flex gap-2">
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating || loading}
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {t('sitemap.regenerate')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(sitemap.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('sitemap.view')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{sitemap.urlCount}</p>
              <p className="text-xs text-muted-foreground">{t('sitemap.totalUrls')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {sitemap.indexedCount}
              </p>
              <p className="text-xs text-muted-foreground">{t('sitemap.indexed')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {sitemap.pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">{t('sitemap.pending')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {sitemap.errorCount}
              </p>
              <p className="text-xs text-muted-foreground">{t('sitemap.errors')}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('sitemap.indexProgress')}</span>
              <span className="font-medium">{indexedPercent}%</span>
            </div>
            <Progress value={indexedPercent} className="h-2" />
          </div>

          {/* Last Generated */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('sitemap.lastGenerated')}
            </span>
            <span>{formatDate(sitemap.lastGenerated)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Search Engines */}
      {searchEngines.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('indexing.searchEngines')}
              </CardTitle>
              {onPingSearchEngines && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePing}
                  disabled={pinging}
                >
                  {pinging ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {t('indexing.pingAll')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchEngines.map((engine) => (
                <div
                  key={engine.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        engine.status === 'success' &&
                          'bg-green-100 text-green-600',
                        engine.status === 'error' && 'bg-red-100 text-red-600',
                        engine.status === 'pending' &&
                          'bg-amber-100 text-amber-600'
                      )}
                    >
                      {engine.status === 'success' && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {engine.status === 'error' && (
                        <XCircle className="h-4 w-4" />
                      )}
                      {engine.status === 'pending' && (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{engine.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('indexing.lastPing')}: {formatDate(engine.lastPing)}
                      </p>
                    </div>
                  </div>
                  {engine.indexedUrls !== undefined && (
                    <Badge variant="secondary">
                      {engine.indexedUrls} {t('sitemap.indexed')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* URLs Table */}
      {showUrls && sitemap.urls && sitemap.urls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('sitemap.urls')} ({sitemap.urls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sitemap.url')}</TableHead>
                  <TableHead>{t('sitemap.lastModified')}</TableHead>
                  <TableHead>{t('sitemap.priority')}</TableHead>
                  <TableHead>{t('sitemap.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sitemap.urls.slice(0, maxUrls).map((url, index) => {
                  const status = url.indexStatus
                    ? indexStatusConfig[url.indexStatus]
                    : null;
                  return (
                    <TableRow key={index}>
                      <TableCell className="max-w-[300px] truncate font-mono text-sm">
                        {url.loc}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {url.lastmod || '-'}
                      </TableCell>
                      <TableCell>
                        {url.priority !== undefined && (
                          <Badge variant="outline">{url.priority}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {status && (
                          <div
                            className={cn('flex items-center gap-1', status.color)}
                          >
                            {status.icon}
                            <span className="text-sm">{status.label}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {sitemap.urls.length > maxUrls && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('common.showingOf', {
                  showing: maxUrls,
                  total: sitemap.urls.length,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SitemapStatus;
