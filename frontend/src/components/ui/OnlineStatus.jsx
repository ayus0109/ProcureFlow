import React, { useState, useEffect } from 'react';
import { retryOfflineQueue } from '../../services/offlineStore';

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowStatus(true);
      
      try {
        const fetchWrapper = async (endpoint, method, body) => {
          const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
          });
          if (!res.ok) throw new Error('API request failed');
          return res.json();
        };
        
        await retryOfflineQueue(fetchWrapper);
      } catch (err) {
        console.error('Error retrying offline queue:', err);
      }

      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`w-full py-2 px-4 text-center text-sm font-medium transition-all duration-300 ${
      isOnline 
        ? 'bg-emerald-50 text-emerald-700' 
        : 'bg-amber-50 text-amber-700'
    }`}>
      <div className="flex items-center justify-center space-x-2">
        <span className="relative flex h-2.5 w-2.5">
          {isOnline ? (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          )}
        </span>
        <span>
          {isOnline 
            ? 'Connected' 
            : 'Offline — data saved locally'}
        </span>
      </div>
    </div>
  );
}
