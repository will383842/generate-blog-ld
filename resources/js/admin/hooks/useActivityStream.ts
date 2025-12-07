/**
 * useActivityStream Hook
 * Real-time activity stream using WebSocket or polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { activityKeys, type Activity, type ActivityType } from './useActivity';

// ============================================================================
// Types
// ============================================================================

export interface ActivityStreamOptions {
  /** Enable real-time updates */
  enabled?: boolean;
  /** Filter by activity types */
  types?: ActivityType[];
  /** Maximum items to keep in buffer */
  maxItems?: number;
  /** Polling interval in ms (fallback when WebSocket unavailable) */
  pollingInterval?: number;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
}

export interface ActivityStreamState {
  activities: Activity[];
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'none';
  error: Error | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useActivityStream(options: ActivityStreamOptions = {}) {
  const {
    enabled = true,
    types,
    maxItems = 50,
    pollingInterval = 10000,
    autoReconnect = true,
  } = options;

  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<ActivityStreamState>({
    activities: [],
    isConnected: false,
    connectionType: 'none',
    error: null,
  });

  // Add new activity to the stream
  const addActivity = useCallback(
    (activity: Activity) => {
      // Filter by types if specified
      if (types && !types.includes(activity.type)) {
        return;
      }

      setState((prev) => ({
        ...prev,
        activities: [activity, ...prev.activities].slice(0, maxItems),
      }));

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    [types, maxItems, queryClient]
  );

  // Polling fallback
  const startPolling = useCallback(() => {
    if (!enabled) return;

    setState((prev) => ({
      ...prev,
      isConnected: true,
      connectionType: 'polling',
    }));

    let lastTimestamp = new Date().toISOString();

    const poll = async () => {
      try {
        const requestParams: Record<string, string> = {
          since: lastTimestamp,
          limit: '20',
        };
        if (types) {
          requestParams.types = types.join(',');
        }

        const { data: activities } = await api.get<Activity[]>('/admin/activity/stream', { params: requestParams });

        if (activities.length > 0) {
          lastTimestamp = activities[0].createdAt;
          activities.reverse().forEach(addActivity);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollingIntervalRef.current = setInterval(poll, pollingInterval);
    poll(); // Initial fetch
  }, [enabled, types, pollingInterval, addActivity]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/activity`);

      ws.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionType: 'websocket',
          error: null,
        }));

        // Subscribe to specific types if needed
        if (types) {
          ws.send(JSON.stringify({ action: 'subscribe', types }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'activity' && data.payload) {
            addActivity(data.payload as Activity);
          }
        } catch (e) {
          console.error('Failed to parse activity message:', e);
        }
      };

      ws.onerror = () => {
        console.error('WebSocket error');
        setState((prev) => ({
          ...prev,
          error: new Error('WebSocket connection error'),
        }));
      };

      ws.onclose = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionType: 'none',
        }));

        // Auto-reconnect after delay
        if (autoReconnect && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch {
      // WebSocket not available, fall back to polling
      startPolling();
    }
  }, [enabled, types, addActivity, autoReconnect, startPolling]);

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
    stopPolling();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionType: 'none',
    }));
  }, [stopPolling]);

  // Clear activities
  const clearActivities = useCallback(() => {
    setState((prev) => ({ ...prev, activities: [] }));
  }, []);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connectWebSocket, disconnect]);

  return {
    ...state,
    clearActivities,
    disconnect,
    reconnect: connectWebSocket,
  };
}

export default useActivityStream;
