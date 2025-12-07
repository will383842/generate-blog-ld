/**
 * Top Performers Component
 * File 332 - Table of top performing content
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Download,
  ArrowUpDown,
  Eye,
  Clock,
  Target,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useTopPerformers, PeriodType, TopContent } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface TopPerformersProps {
  type?: string;
  period?: PeriodType;
  limit?: number;
  showExport?: boolean;
}

export function TopPerformers({
  type = 'articles',
  period = '30d',
  limit = 20,
  showExport = true,
}: TopPerformersProps) {
  const { t } = useTranslation();
  const { data: performers, isLoading } = useTopPerformers(type, period);

  const [sortBy, setSortBy] = useState<'views' | 'conversions' | 'trend'>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Sort data
  const sortedData = [...(performers || [])].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  }).slice(0, limit);

  // Toggle sort
  const toggleSort = (column: 'views' | 'conversions' | 'trend') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csv = [
      'rank,title,url,views,unique_views,avg_time,bounce_rate,conversions,trend',
      ...sortedData.map((item, idx) =>
        `${idx + 1},"${item.title}","${item.url}",${item.views},${item.uniqueViews},${item.avgTimeOnPage},${item.bounceRate},${item.conversions},${item.trend}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-${type}-${period}.csv`;
    a.click();
  };

  // Trend indicator
  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={cn(
      'flex items-center text-sm font-medium',
      value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
    )}>
      {value > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : 
       value < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  // Get rank badge color
  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-muted';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top contenu
            </CardTitle>
            <CardDescription>Les pages les plus performantes</CardDescription>
          </div>
          {showExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Top 3 Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {sortedData.slice(0, 3).map((item, idx) => (
            <Card key={item.id} className={cn('border-2', idx === 0 && 'border-yellow-300')}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getRankBadge(idx + 1)}>
                    #{idx + 1}
                  </Badge>
                  <TrendIndicator value={item.trend} />
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.title}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(item.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDuration(item.avgTimeOnPage)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span>{item.conversions}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {item.bounceRate.toFixed(1)}% bounce
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Contenu</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('views')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Vues
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Uniques</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead className="text-right">Bounce</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('conversions')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Conv.
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('trend')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Trend
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline" className={getRankBadge(idx + 1)}>
                      {idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium truncate max-w-[300px]">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.platformName}</p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(item.views)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.uniqueViews)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDuration(item.avgTimeOnPage)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      item.bounceRate > 70 ? 'text-red-600' :
                      item.bounceRate > 50 ? 'text-yellow-600' : 'text-green-600'
                    )}>
                      {item.bounceRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{item.conversions}</TableCell>
                  <TableCell className="text-right">
                    <TrendIndicator value={item.trend} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default TopPerformers;
