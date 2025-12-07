/**
 * Claim Verifier Component
 * File 290 - Display single claim verification result
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  FactCheckResult,
  FactCheckSource,
  getVerificationStatusColor,
  getVerificationStatusLabel,
} from '@/types/research';
import { ConfidenceMeter } from './ConfidenceMeter';
import { cn } from '@/lib/utils';

interface ClaimVerifierProps {
  result: FactCheckResult;
  compact?: boolean;
  showSources?: boolean;
  showAlternatives?: boolean;
}

export function ClaimVerifier({
  result,
  compact = false,
  showSources = true,
  showAlternatives = true,
}: ClaimVerifierProps) {
  const { t } = useTranslation();

  // Get verification icon
  const getVerificationIcon = () => {
    const iconClass = 'h-6 w-6';
    switch (result.status) {
      case 'verified':
        return <Check className={cn(iconClass, 'text-green-500')} />;
      case 'false':
        return <X className={cn(iconClass, 'text-red-500')} />;
      case 'partially_verified':
        return <AlertTriangle className={cn(iconClass, 'text-yellow-500')} />;
      case 'uncertain':
        return <HelpCircle className={cn(iconClass, 'text-purple-500')} />;
      default:
        return <Info className={cn(iconClass, 'text-gray-500')} />;
    }
  };

  // Get status background
  const getStatusBackground = () => {
    switch (result.status) {
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'false':
        return 'bg-red-50 border-red-200';
      case 'partially_verified':
        return 'bg-yellow-50 border-yellow-200';
      case 'uncertain':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className={cn('p-3 rounded-lg border', getStatusBackground())}>
        <div className="flex items-start gap-3">
          {getVerificationIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2">{result.claim}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                style={{
                  backgroundColor: getVerificationStatusColor(result.status),
                  color: 'white',
                }}
              >
                {getVerificationStatusLabel(result.status)}
              </Badge>
              <ConfidenceMeter value={result.confidence} size="sm" showLabel={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('border-2', getStatusBackground())}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-white border">
            {getVerificationIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-medium">
              {result.claim}
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <Badge
                className="text-sm"
                style={{
                  backgroundColor: getVerificationStatusColor(result.status),
                  color: 'white',
                }}
              >
                {getVerificationStatusLabel(result.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Vérifié en {result.duration_ms}ms
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Meter */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
          <span className="text-sm font-medium">Niveau de confiance</span>
          <ConfidenceMeter value={result.confidence} size="md" />
        </div>

        {/* Explanation */}
        <div className="p-4 bg-white rounded-lg">
          <h4 className="text-sm font-medium mb-2">Explication</h4>
          <p className="text-sm text-muted-foreground">{result.explanation}</p>
        </div>

        {/* Sources */}
        {showSources && result.sources.length > 0 && (
          <div className="p-4 bg-white rounded-lg">
            <h4 className="text-sm font-medium mb-3">
              Sources ({result.sources.length})
            </h4>
            <div className="space-y-3">
              {result.sources.map((source, idx) => (
                <SourceCard key={idx} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Alternative Claims */}
        {showAlternatives && result.alternative_claims && result.alternative_claims.length > 0 && (
          <div className="p-4 bg-white rounded-lg">
            <h4 className="text-sm font-medium mb-2">Affirmations alternatives</h4>
            <ul className="space-y-2">
              {result.alternative_claims.map((alt, idx) => (
                <li
                  key={idx}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {alt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrections */}
        {result.corrections && result.corrections.length > 0 && (
          <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
            <h4 className="text-sm font-medium mb-2 text-green-700">
              Corrections suggérées
            </h4>
            <ul className="space-y-2">
              {result.corrections.map((correction, idx) => (
                <li
                  key={idx}
                  className="text-sm text-green-700 flex items-start gap-2"
                >
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  {correction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Source card sub-component
function SourceCard({ source }: { source: FactCheckSource }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        source.supports_claim
          ? 'border-green-200 bg-green-50/50'
          : 'border-red-200 bg-red-50/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {source.supports_claim ? (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <X className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline truncate"
            >
              {source.title}
            </a>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {source.snippet}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {source.domain}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      source.reliability >= 80
                        ? 'bg-green-100 text-green-800'
                        : source.reliability >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {source.reliability}% fiable
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Score de fiabilité de la source
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimVerifier;
