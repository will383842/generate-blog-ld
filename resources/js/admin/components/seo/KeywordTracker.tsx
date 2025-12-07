import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Target,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KeywordData {
  id: string;
  keyword: string;
  density: number;
  count: number;
  volume?: number;
  difficulty?: number;
  position?: number;
  positionChange?: number;
  isTracked?: boolean;
}

export interface KeywordTrackerProps {
  keywords: KeywordData[];
  targetDensity?: { min: number; max: number };
  onAddKeyword?: (keyword: string) => void;
  onRemoveKeyword?: (id: string) => void;
  onTrackKeyword?: (id: string) => void;
  showVolumeData?: boolean;
  showPositionData?: boolean;
  className?: string;
}

const getDensityColor = (
  density: number,
  target: { min: number; max: number }
) => {
  if (density >= target.min && density <= target.max) return 'text-green-600';
  if (density < target.min * 0.5 || density > target.max * 1.5) return 'text-red-600';
  return 'text-amber-600';
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 30) return 'bg-green-500';
  if (difficulty <= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

export function KeywordTracker({
  keywords,
  targetDensity = { min: 1, max: 3 },
  onAddKeyword,
  onRemoveKeyword,
  onTrackKeyword,
  showVolumeData = true,
  showPositionData = true,
  className,
}: KeywordTrackerProps) {
  const { t } = useTranslation('seo');
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (newKeyword.trim() && onAddKeyword) {
      onAddKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  };

  const renderPositionChange = (change?: number) => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          +{change}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        {change}
      </span>
    );
  };

  const trackedKeywords = keywords.filter((k) => k.isTracked);
  const topKeywords = [...keywords]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Add Keyword */}
      {onAddKeyword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('keywords.trackNew')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={t('keywords.enterKeyword')}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                {t('actions.add')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('keywords.topKeywords')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topKeywords.map((keyword) => (
              <div key={keyword.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{keyword.keyword}</span>
                  <span
                    className={cn(
                      'text-sm font-mono',
                      getDensityColor(keyword.density, targetDensity)
                    )}
                  >
                    {keyword.density.toFixed(2)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(keyword.density * 20, 100)}
                  className="h-1.5"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{keyword.count} {t('keywords.occurrences')}</span>
                  <span>
                    {t('keywords.target')}: {targetDensity.min}-{targetDensity.max}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracked Keywords Table */}
      {trackedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('keywords.tracked')} ({trackedKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('keywords.keyword')}</TableHead>
                  <TableHead className="text-right">{t('keywords.density')}</TableHead>
                  {showVolumeData && (
                    <>
                      <TableHead className="text-right">{t('keywords.volume')}</TableHead>
                      <TableHead>{t('keywords.difficulty')}</TableHead>
                    </>
                  )}
                  {showPositionData && (
                    <>
                      <TableHead className="text-right">{t('keywords.position')}</TableHead>
                      <TableHead>{t('keywords.change')}</TableHead>
                    </>
                  )}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedKeywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell className="font-medium">
                      {keyword.keyword}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono',
                        getDensityColor(keyword.density, targetDensity)
                      )}
                    >
                      {keyword.density.toFixed(2)}%
                    </TableCell>
                    {showVolumeData && (
                      <>
                        <TableCell className="text-right">
                          {keyword.volume?.toLocaleString() ?? '-'}
                        </TableCell>
                        <TableCell>
                          {keyword.difficulty !== undefined ? (
                            <div className="flex items-center gap-2">
                              <Progress
                                value={keyword.difficulty}
                                className="h-2 w-16"
                                indicatorClassName={getDifficultyColor(
                                  keyword.difficulty
                                )}
                              />
                              <span className="text-xs">{keyword.difficulty}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </>
                    )}
                    {showPositionData && (
                      <>
                        <TableCell className="text-right font-mono">
                          {keyword.position ?? '-'}
                        </TableCell>
                        <TableCell>
                          {renderPositionChange(keyword.positionChange)}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {onRemoveKeyword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveKeyword(keyword.id)}
                        >
                          {t('actions.remove')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KeywordTracker;
