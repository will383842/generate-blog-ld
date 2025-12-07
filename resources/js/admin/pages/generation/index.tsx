/**
 * Generation Overview Page
 * Dashboard for content generation system
 */

import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileSpreadsheet,
  Type,
  Clock,
  ArrowRight,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QueueStats } from '@/components/generation/QueueStats';
import { JobCard } from '@/components/generation/JobCard';
import { useQueue, useQueueStats, useCancelJob, useRetryJob } from '@/hooks/useQueue';

export function GenerationOverview() {
  const navigate = useNavigate();
  const { data: recentJobs } = useQueue({ perPage: 10 });
  const { data: statsData } = useQueueStats();
  const cancelJob = useCancelJob();
  const retryJob = useRetryJob();

  const stats = statsData?.data;
  const jobs = recentJobs?.data || [];

  const quickActions = [
    {
      id: 'wizard',
      title: 'Assistant de génération',
      description: 'Créer du contenu étape par étape',
      icon: Sparkles,
      color: 'bg-purple-500',
      href: '/generation/wizard',
    },
    {
      id: 'bulk',
      title: 'Import CSV',
      description: 'Génération en masse depuis un fichier',
      icon: FileSpreadsheet,
      color: 'bg-green-500',
      href: '/generation/bulk-csv',
    },
    {
      id: 'manual',
      title: 'Titre manuel',
      description: 'Créer un article à partir d\'un titre',
      icon: Type,
      color: 'bg-blue-500',
      href: '/generation/manual-titles',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Génération de contenu</h1>
          <p className="text-muted-foreground">
            Créez et gérez la génération automatique d'articles
          </p>
        </div>
        <Button onClick={() => navigate('/generation/wizard')}>
          <Sparkles className="w-4 h-4 mr-2" />
          Nouvelle génération
        </Button>
      </div>

      {/* Quick Stats */}
      <QueueStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(action.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-lg', action.color)}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.todayCompleted || 0}</p>
                <p className="text-xs text-muted-foreground">Générés aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.todayCost?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">Coût aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.jobsPerMinute?.toFixed(1) || 0}/min
                </p>
                <p className="text-xs text-muted-foreground">Débit actuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jobs récents</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/generation/queue')}>
            Voir tout
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun job récent
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCancel={(id) => cancelJob.mutate(id)}
                  onRetry={(id) => retryJob.mutate(id)}
                  onView={(id) => navigate(`/generation/history?job=${id}`)}
                />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-muted-foreground">
              Historique complet disponible
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/generation/history')}>
              Historique
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/generation/queue')}
        >
          <Clock className="w-5 h-5" />
          <span>File d'attente</span>
          {stats?.pending && stats.pending > 0 && (
            <Badge>{stats.pending}</Badge>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/generation/history')}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Historique</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/generation/templates')}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Templates</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/generation/settings')}
        >
          <Sparkles className="w-5 h-5" />
          <span>Paramètres</span>
        </Button>
      </div>
    </div>
  );
}

export default GenerationOverview;
