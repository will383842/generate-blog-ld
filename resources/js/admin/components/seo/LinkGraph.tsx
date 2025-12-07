import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  ExternalLink,
  Link2,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LinkType = 'internal' | 'external';
export type LinkStatus = 'valid' | 'broken' | 'redirect';

export interface LinkData {
  id: string;
  url: string;
  anchorText: string;
  type: LinkType;
  status: LinkStatus;
  statusCode?: number;
  targetPage?: string;
  nofollow?: boolean;
}

export interface LinkGraphProps {
  links: LinkData[];
  showTable?: boolean;
  showStats?: boolean;
  maxTableRows?: number;
  onLinkClick?: (link: LinkData) => void;
  className?: string;
}

const statusConfig = {
  valid: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  broken: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  redirect: {
    icon: <ArrowUpRight className="h-4 w-4" />,
    color: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export function LinkGraph({
  links,
  showTable = true,
  showStats = true,
  maxTableRows = 10,
  onLinkClick,
  className,
}: LinkGraphProps) {
  const { t } = useTranslation('seo');

  const stats = useMemo(() => {
    const internal = links.filter((l) => l.type === 'internal');
    const external = links.filter((l) => l.type === 'external');
    const broken = links.filter((l) => l.status === 'broken');
    const redirects = links.filter((l) => l.status === 'redirect');
    const nofollow = links.filter((l) => l.nofollow);

    return {
      total: links.length,
      internal: internal.length,
      external: external.length,
      broken: broken.length,
      redirects: redirects.length,
      nofollow: nofollow.length,
      validPercent: Math.round(
        ((links.length - broken.length) / links.length) * 100
      ) || 0,
    };
  }, [links]);

  const displayLinks = maxTableRows ? links.slice(0, maxTableRows) : links;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.internal}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('links.internal')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.external}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('links.external')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.broken}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('links.broken')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.validPercent}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t('links.validRate')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Links Table */}
      {showTable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('links.allLinks')} ({stats.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('links.anchorText')}</TableHead>
                  <TableHead>{t('links.url')}</TableHead>
                  <TableHead>{t('links.type')}</TableHead>
                  <TableHead>{t('links.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLinks.map((link) => {
                  const config = statusConfig[link.status];
                  return (
                    <TableRow
                      key={link.id}
                      className={cn(onLinkClick && 'cursor-pointer hover:bg-muted/50')}
                      onClick={() => onLinkClick?.(link)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {link.anchorText || <span className="text-muted-foreground italic">No text</span>}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm text-muted-foreground">
                            {link.url}
                          </span>
                          {link.nofollow && (
                            <Badge variant="outline" className="text-xs">
                              nofollow
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {link.type === 'internal' ? (
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                          ) : (
                            <ExternalLink className="h-3 w-3 mr-1" />
                          )}
                          {t(`links.${link.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <Badge className={cn('text-xs', config.badge)}>
                            {t(`links.status.${link.status}`)}
                            {link.statusCode && ` (${link.statusCode})`}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {maxTableRows && links.length > maxTableRows && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('common.showingOf', {
                  showing: maxTableRows,
                  total: links.length,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LinkGraph;
