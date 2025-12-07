/**
 * useQueueRealtime Hook
 * Real-time queue updates using WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queueKeys } from './useQueue';
import type { QueueItem, QueueStats } from '@/types/generation';

// ============================================================================
// Types
// ============================================================================

export interface QueueRealtimeOptions {
  /** Enable real-time updates */
  enabled?: boolean;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
}

export interface QueueRealtimeState {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: Error | null;
}

export type QueueEventType =
  | 'job:created'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:cancelled'
  | 'queue:paused'
  | 'queue:resumed'
  | 'stats:updated';

export interface QueueEvent {
  type: QueueEventType;
  payload: QueueItem | QueueStats | { jobId: string; progress: number };
  timestamp: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useQueueRealtime(options: QueueRealtimeOptions = {}) {
  const {
    enabled = true,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<QueueRealtimeState>({
    isConnected: false,
    lastUpdate: null,
    error: null,
  });

  // Event handlers map
  const eventHandlersRef = useRef<Map<QueueEventType, Set<(event: QueueEvent) => void>>>(new Map());

  // Subscribe to specific events
  const subscribe = useCallback(
    (eventType: QueueEventType, handler: (event: QueueEvent) => void) => {
      if (!eventHandlersRef.current.has(eventType)) {
        eventHandlersRef.current.set(eventType, new Set());
      }
      eventHandlersRef.current.get(eventType)!.add(handler);

      // Return unsubscribe function
      return () => {
        eventHandlersRef.current.get(eventType)?.delete(handler);
      };
    },
    []
  );

  // Handle incoming event
  const handleEvent = useCallback(
    (event: QueueEvent) => {
      setState((prev) => ({ ...prev, lastUpdate: new Date() }));

      // Invalidate relevant queries based on event type
      switch (event.type) {
        case 'job:created':
        case 'job:completed':
        case 'job:failed':
        case 'job:cancelled':
          queryClient.invalidateQueries({ queryKey: queueKeys.list() });
          queryClient.invalidateQueries({ queryKey: queueKeys.stats() });
          break;

        case 'job:started':
        case 'job:progress':
          // Update specific job in cache
          if ('id' in event.payload) {
            const jobId = (event.payload as QueueItem).id;
            queryClient.setQueryData(queueKeys.job(jobId), event.payload);
          }
          break;

        case 'stats:updated':
          queryClient.setQueryData(queueKeys.stats(), { data: event.payload });
          break;

        case 'queue:paused':
        case 'queue:resumed':
          queryClient.invalidateQueries({ queryKey: queueKeys.config() });
          break;
      }

      // Call registered handlers
      const handlers = eventHandlersRef.current.get(event.type);
      if (handlers) {
        handlers.forEach((handler) => handler(event));
      }
    },
    [queryClient]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/queue`);

      ws.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: QueueEvent = JSON.parse(event.data);
          handleEvent(data);
        } catch (e) {
          console.error('Failed to parse queue event:', e);
        }
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: new Error('WebSocket connection error'),
        }));
      };

      ws.onclose = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));

        // Auto-reconnect
        if (autoReconnect && enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setState((prev) => ({
        ...prev,
        error: e instanceof Error ? e : new Error('Failed to connect'),
      }));
    }
  }, [enabled, autoReconnect, reconnectDelay, handleEvent]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isConnected: false,
    }));
  }, []);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    ...state,
    subscribe,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook to subscribe to specific job updates
 */
export function useJobProgress(jobId: string) {
  const [progress, setProgress] = useState<number>(0);
  const { subscribe, isConnected } = useQueueRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('job:progress', (event) => {
      if ('jobId' in event.payload && event.payload.jobId === jobId) {
        setProgress((event.payload as { jobId: string; progress: number }).progress);
      }
    });

    return unsubscribe;
  }, [jobId, subscribe]);

  return { progress, isConnected };
}

/**
 * Hook to get real-time queue stats
 */
export function useRealtimeQueueStats() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const { subscribe, isConnected, lastUpdate } = useQueueRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('stats:updated', (event) => {
      setStats(event.payload as QueueStats);
    });

    return unsubscribe;
  }, [subscribe]);

  return { stats, isConnected, lastUpdate };
}

export default useQueueRealtime;
