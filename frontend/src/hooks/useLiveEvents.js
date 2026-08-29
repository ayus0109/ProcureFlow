/**
 * useLiveEvents.js
 *
 * Real-time SSE listener for instantaneous queue and payment status updates.
 */

import { useEffect } from 'react';

export function useLiveEvents(onEvent) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) return;

    let es = null;
    try {
      es = new EventSource('/api/events');

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.type !== 'CONNECTED' && onEvent) {
            onEvent(payload);
          }
        } catch {}
      };

      es.onerror = () => {
        // SSE auto-reconnects automatically
      };
    } catch {}

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [onEvent]);
}
