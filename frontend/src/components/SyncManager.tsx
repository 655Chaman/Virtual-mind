'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

export function SyncManager() {
  useEffect(() => {
    async function flushSyncQueue() {
      if (!navigator.onLine) return;
      
      let queueStr = null;
      if (typeof window !== 'undefined' && window.Android) {
        queueStr = window.Android.getOfflineData('offline_sync_queue');
      } else {
        queueStr = localStorage.getItem('offline_sync_queue');
      }

      if (!queueStr) return;
      
      try {
        const queue = JSON.parse(queueStr);
        if (queue.length === 0) return;
        
        console.log(`[SyncManager] Found ${queue.length} offline workouts. Attempting flush...`);
        
        // Try to flush sequentially
        for (let i = 0; i < queue.length; i++) {
          await api.workout.log(queue[i]);
        }
        
        // If all succeeded, clear queue
        console.log('[SyncManager] Offline queue synced successfully.');
        if (typeof window !== 'undefined' && window.Android) {
          window.Android.removeOfflineData('offline_sync_queue');
          window.Android.showNotification("⚡ Elesium", `Successfully synced ${queue.length} offline workouts.`);
        } else {
          localStorage.removeItem('offline_sync_queue');
          if ('Notification' in window && navigator.serviceWorker) {
             navigator.serviceWorker.ready.then(registration => {
               registration.showNotification("⚡ Elesium: Sync Complete", {
                 body: `Successfully synced ${queue.length} offline workouts.`,
                 icon: '/icon-192.png',
                 tag: 'vm-sync-status'
               });
             });
          }
        }
      } catch (err) {
        console.warn('[SyncManager] Failed to flush offline queue. Will retry later.', err);
      }
    }

    // Flush on initial load
    flushSyncQueue();

    // Flush when network comes back online
    window.addEventListener('online', flushSyncQueue);
    return () => window.removeEventListener('online', flushSyncQueue);
  }, []);

  return null;
}
