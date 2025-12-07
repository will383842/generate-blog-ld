/**
 * SEO Score Card
 * Display SEO score with breakdown and suggestions
 */

import { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface SeoCriterion {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  maxScore: number;
  suggestion?: string;
}

export interface SeoScoreCardProps {
  score: number;
  criteria?: SeoCriterion[];
  metaTitle?: string;
  metaDescription?: string;
  url?: string;
  className?: string;
}

function CircularScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#ef4444'; // red
  if (score >= 80) color = '#22c55e'; // green
  else if (score >= 60) color = '#eab308'; // yellow
  else if (score >= 40) color = '#f97316'; // orange

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="56"
          cy="56"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function CriterionItem({ criterion }: { criterion: SeoCriterion }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const StatusIcon = {
    pass: CheckCircle,
    fail: XCircle,
    warning: AlertCircle,
  }[criterion.status];

  const statusColor = {
    pass: 'text-green-600',
    fail: 'text-red-600',
    warning: 'text-yellow-600',
  }[criterion.status];

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('w-5 h-5', statusColor)} />
          <div>
            <p className="font-medium text-sm">{criterion.name}</p>
            <p className="text-xs text-muted-foreground">
              {criterion.score}/{criterion.maxScore} points
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pl-11">
          <p className="text-sm text-muted-foreground mb-2">
            {criterion.description}
          </p>
          {criterion.suggestion && criterion.status !== 'pass' && (
            <div className="p-2 bg-yellow-50 rounded text-sm text-yellow-800">
              💡 {criterion.suggestion}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GooglePreview({
  title,
  description,
  url,
}: {
  title?: string;
  description?: string;
  url?: string;
}) {
  return (
    <div className="p-4 bg-white rounded-lg border">
      <p className="text-xs text-muted-foreground mb-2">Aperçu Google</p>
      <div className="space-y-1">
        <p className="text-sm text-green-700 truncate">
          {url || 'https://example.com/article-slug'}
        </p>
        <p className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
          {title || 'Titre de la page'}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2">
          {description || 'Meta description de la page qui apparaîtra dans les résultats de recherche Google.'}
        </p>
      </div>
    </div>
  );
}

export function SeoScoreCard({
  score,
  criteria = [],
  metaTitle,
  metaDescription,
  url,
  className,
}: SeoScoreCardProps) {
  const [showAllCriteria, setShowAllCriteria] = useState(false);

  const passedCount = criteria.filter((c) => c.status === 'pass').length;
  const failedCount = criteria.filter((c) => c.status === 'fail').length;
  const warningCount = criteria.filter((c) => c.status === 'warning').length;

  const displayedCriteria = showAllCriteria ? criteria : criteria.slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Score SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex items-center gap-6">
          <CircularScore score={score} />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">{passedCount} critères validés</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">{warningCount} avertissements</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">{failedCount} à corriger</span>
            </div>
          </div>
        </div>

        {/* Google Preview */}
        <GooglePreview
          title={metaTitle}
          description={metaDescription}
          url={url}
        />

        {/* Criteria Breakdown */}
        <div>
          <h4 className="font-medium mb-2">Critères d'évaluation</h4>
          <div className="border rounded-lg overflow-hidden">
            {displayedCriteria.map((criterion) => (
              <CriterionItem key={criterion.id} criterion={criterion} />
            ))}
          </div>

          {criteria.length > 5 && (
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setShowAllCriteria(!showAllCriteria)}
            >
              {showAllCriteria
                ? 'Voir moins'
                : `Voir tous les critères (${criteria.length})`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Default criteria for testing
export const DEFAULT_SEO_CRITERIA: SeoCriterion[] = [
  {
    id: 'title-length',
    name: 'Longueur du titre',
    description: 'Le titre doit contenir entre 50 et 60 caractères',
    status: 'pass',
    score: 10,
    maxScore: 10,
  },
  {
    id: 'meta-description',
    name: 'Meta description',
    description: 'La meta description doit contenir entre 150 et 160 caractères',
    status: 'warning',
    score: 5,
    maxScore: 10,
    suggestion: 'Ajoutez plus de détails à votre meta description',
  },
  {
    id: 'keyword-title',
    name: 'Mot-clé dans le titre',
    description: 'Le mot-clé principal doit apparaître dans le titre',
    status: 'pass',
    score: 15,
    maxScore: 15,
  },
  {
    id: 'keyword-density',
    name: 'Densité du mot-clé',
    description: 'Le mot-clé doit apparaître 1-2% du temps dans le contenu',
    status: 'fail',
    score: 0,
    maxScore: 10,
    suggestion: 'Utilisez davantage votre mot-clé principal dans le contenu',
  },
  {
    id: 'headings',
    name: 'Structure des titres',
    description: 'Le contenu doit avoir une structure H1 > H2 > H3 logique',
    status: 'pass',
    score: 10,
    maxScore: 10,
  },
  {
    id: 'internal-links',
    name: 'Liens internes',
    description: 'L\'article doit contenir au moins 2 liens internes',
    status: 'warning',
    score: 5,
    maxScore: 10,
    suggestion: 'Ajoutez des liens vers d\'autres articles de votre site',
  },
  {
    id: 'images-alt',
    name: 'Alt des images',
    description: 'Toutes les images doivent avoir un attribut alt',
    status: 'pass',
    score: 10,
    maxScore: 10,
  },
  {
    id: 'content-length',
    name: 'Longueur du contenu',
    description: 'L\'article doit contenir au moins 1000 mots',
    status: 'pass',
    score: 15,
    maxScore: 15,
  },
];

export default SeoScoreCard;
