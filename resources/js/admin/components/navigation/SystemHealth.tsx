/**
 * System Health Component
 * Real-time system status indicator showing API health, workers, queues
 * 
 * Features:
 * - API response times
 * - Worker status
 * - Queue lengths
 * - Alert on issues
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Server,
  Zap,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import api from '@/utils/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';

// ============================================================================
// Types
// ============================================================================

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  lastChecked: string;
}

interface WorkerStatus {
  name: string;
  active: number;
  total: number;
  processing: number;
  failed24h: number;
}

interface QueueStatus {
  name: string;
  pending: number;
  processing: number;
  failed: number;
  avgWaitTime: number;
}

interface SystemHealthData {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceStatus[];
  workers: WorkerStatus[];
  queues: QueueStatus[];
  lastUpdated: string;
}

// ============================================================================
// API
// ============================================================================

async function fetchSystemHealth(): Promise<SystemHealthData> {
  const response = await api.get<SystemHealthData>('/admin/system/health');
  return response.data;
}

// ============================================================================
// Status Icons & Colors
// ============================================================================

function StatusIcon({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'down':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusColor(status: 'healthy' | 'degraded' | 'down'): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'degraded':
      return 'text-amber-500';
    case 'down':
      return 'text-red-500';
  }
}

function getLatencyColor(latency: number): string {
  if (latency < 100) return 'text-green-500';
  if (latency < 300) return 'text-amber-500';
  return 'text-red-500';
}

// ============================================================================
// Service Row Component
// ============================================================================

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <StatusIcon status={service.status} />
        <span className="text-sm font-medium">{service.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className={cn('text-xs font-mono', getLatencyColor(service.latency))}>
            {service.latency}ms
          </span>
        )}
        <span className={cn('text-xs capitalize', getStatusColor(service.status))}>
          {service.status === 'healthy' ? 'OK' : service.status}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Worker Row Component
// ============================================================================

function WorkerRow({ worker }: { worker: WorkerStatus }) {
  const healthPercent = (worker.active / worker.total) * 100;
  const isHealthy = worker.active === worker.total;
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Server className={cn('h-4 w-4', isHealthy ? 'text-green-500' : 'text-amber-500')} />
          <span className="text-sm font-medium">{worker.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {worker.active}/{worker.total} actifs
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={healthPercent} className="h-1.5 flex-1" />
        {worker.processing > 0 && (
          <span className="text-xs text-muted-foreground">
            {worker.processing} en cours
          </span>
        )}
      </div>
      {worker.failed24h > 0 && (
        <p className="text-xs text-amber-500 mt-1">
          {worker.failed24h} échecs (24h)
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Queue Row Component
// ============================================================================

function QueueRow({ queue }: { queue: QueueStatus }) {
  const total = queue.pending + queue.processing;
  const hasBacklog = queue.pending > 100;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Zap className={cn('h-4 w-4', hasBacklog ? 'text-amber-500' : 'text-muted-foreground')} />
        <span className="text-sm font-medium">{queue.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-xs', hasBacklog ? 'text-amber-500' : 'text-muted-foreground')}>
          {queue.pending} en attente
        </span>
        {queue.failed > 0 && (
          <span className="text-xs text-red-500">
            {queue.failed} échecs
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface SystemHealthProps {
  className?: string;
  compact?: boolean;
}

export function SystemHealth({ className, compact = true }: SystemHealthProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000,
  });

  // Determine overall status
  const overallStatus = data?.overall ?? 'healthy';
  
  // Compact indicator button
  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn('gap-2 h-8', className)}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : isError ? (
        <WifiOff className="h-4 w-4 text-red-500" />
      ) : (
        <StatusIcon status={overallStatus} />
      )}
      {!compact && (
        <span className={cn('text-sm', getStatusColor(overallStatus))}>
          {overallStatus === 'healthy' ? 'Système OK' : 
           overallStatus === 'degraded' ? 'Dégradé' : 'Hors ligne'}
        </span>
      )}
      {isOpen ? (
        <ChevronUp className="h-3 w-3 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  );

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            État du système
          </TooltipContent>
        </Tooltip>
        
        <PopoverContent className="w-80 p-0" align="end">
          <SystemHealthContent 
            data={data} 
            isLoading={isLoading} 
            isError={isError}
            onRefresh={() => refetch()}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <SystemHealthContent 
        data={data} 
        isLoading={isLoading} 
        isError={isError}
        onRefresh={() => refetch()}
      />
    </div>
  );
}

// ============================================================================
// Content Component
// ============================================================================

interface SystemHealthContentProps {
  data?: SystemHealthData;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

function SystemHealthContent({ data, isLoading, isError, onRefresh }: SystemHealthContentProps) {
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center">
        <WifiOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          Impossible de récupérer l'état du système
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <span className="font-semibold">État du système</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={data.overall} />
          <span className={cn('text-sm font-medium', getStatusColor(data.overall))}>
            {data.overall === 'healthy' ? 'Opérationnel' : 
             data.overall === 'degraded' ? 'Dégradé' : 'Problème'}
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="p-4 border-b">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Services
        </h4>
        <div className="divide-y">
          {data.services.map((service) => (
            <ServiceRow key={service.name} service={service} />
          ))}
        </div>
      </div>

      {/* Workers */}
      <div className="p-4 border-b">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Workers
        </h4>
        <div className="space-y-1">
          {data.workers.map((worker) => (
            <WorkerRow key={worker.name} worker={worker} />
          ))}
        </div>
      </div>

      {/* Queues */}
      <div className="p-4 border-b">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Queues
        </h4>
        <div className="divide-y">
          {data.queues.map((queue) => (
            <QueueRow key={queue.name} queue={queue} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 flex items-center justify-between bg-muted/30">
        <span className="text-xs text-muted-foreground">
          Dernière mise à jour: {new Date(data.lastUpdated).toLocaleTimeString()}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualiser
        </Button>
      </div>
    </div>
  );
}

export default SystemHealth;
