'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, CheckCircle, AlertTriangle, X } from 'lucide-react';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};
const API_BASE = getApiBase();

// Convert URL-safe base64 to Uint8Array for VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type NotifState = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported' | 'error';

interface PushNotificationToggleProps {
  compact?: boolean;
}

export function PushNotificationToggle({ compact = false }: PushNotificationToggleProps) {
  const [state, setState] = useState<NotifState>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [swReady, setSwReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Check existing permission + service worker state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      setStatusMsg('Web Push is not supported in this browser.');
      return;
    }

    // Check current permission
    if (Notification.permission === 'denied') {
      setState('denied');
      setStatusMsg('Notifications are blocked. Please allow them in your browser settings.');
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      setSwReady(true);
      console.log('[VM Push] Service Worker registered:', registration.scope);

      // Check if already subscribed
      return registration.pushManager.getSubscription();
    }).then((existingSubscription) => {
      if (existingSubscription) {
        setState('subscribed');
        setStatusMsg('Push notifications are active. You will be alerted by Virtual Mind.');
      }
    }).catch((err) => {
      console.warn('[VM Push] Service Worker registration failed:', err);
      setState('error');
      setStatusMsg('Service Worker failed to register.');
    });
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!swReady) return;
    setState('requesting');
    setStatusMsg('Requesting notification permission...');

    try {
      // Get VAPID public key from backend
      const keyRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
      if (!keyRes.ok) {
        throw new Error('VAPID key not available. Run generate_vapid_keys.py on the backend.');
      }
      const { publicKey } = await keyRes.json();

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setStatusMsg('Permission denied. Enable notifications in your browser settings to continue.');
        return;
      }

      // Subscribe via PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      // Send subscription to backend
      const subRes = await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!subRes.ok) {
        throw new Error('Failed to register subscription on server.');
      }

      setState('subscribed');
      setStatusMsg('✅ Subscribed! Virtual Mind will now alert you directly.');
    } catch (err: any) {
      console.warn('[VM Push] Subscribe error:', err);
      setState('error');
      setStatusMsg(`Error: ${err.message}`);
    }
  }, [swReady]);

  const handleUnsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Notify backend
        await fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        await subscription.unsubscribe();
      }
      setState('idle');
      setStatusMsg('Unsubscribed from push notifications.');
    } catch (err) {
      console.warn('[VM Push] Unsubscribe error:', err);
    }
  }, []);

  const handleSendTest = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⚡ Virtual Mind Test',
          body: 'Push notifications are working. Bismillah — no friction between thought and action.',
          url: '/command',
          tag: 'vm-test',
        }),
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.warn('[VM Push] Test failed:', err);
    }
  }, []);

  // Compact pill version for nav/header
  if (compact) {
    if (state === 'subscribed') {
      return (
        <button
          id="push-notif-active-btn"
          onClick={handleUnsubscribe}
          title="Push notifications active — click to disable"
          className="flex items-center gap-1.5 px-2 py-1.5 border border-vm-green/30 bg-vm-green/5 text-vm-green text-[10px] tracking-widest hover:bg-vm-green/10 transition-colors"
        >
          <BellRing className="w-3 h-3 animate-pulse" />
          ALERTS ON
        </button>
      );
    }
    if (state === 'unsupported' || state === 'denied') return null;
    return (
      <button
        id="push-notif-enable-btn"
        onClick={handleSubscribe}
        disabled={state === 'requesting'}
        title="Enable push notifications from Virtual Mind"
        className="flex items-center gap-1.5 px-2 py-1.5 border border-surface2 text-text-dim text-[10px] tracking-widest hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
      >
        <Bell className="w-3 h-3" />
        ENABLE ALERTS
      </button>
    );
  }

  // ─── Full Card Version ────────────────────────────────────────────────────
  if (dismissed) return null;
  if (state === 'unsupported') return null;

  return (
    <div
      id="push-notification-panel"
      className={`relative bg-surface border p-5 transition-all duration-300 ${
        state === 'subscribed'
          ? 'border-vm-green/30'
          : state === 'denied' || state === 'error'
          ? 'border-vm-red/30'
          : 'border-surface2'
      }`}
    >
      {/* Dismiss button */}
      {state !== 'subscribed' && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-text-dim hover:text-gray-300 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`mt-0.5 shrink-0 ${
          state === 'subscribed' ? 'text-vm-green' :
          state === 'denied' || state === 'error' ? 'text-vm-red' :
          'text-gold'
        }`}>
          {state === 'subscribed' ? (
            <BellRing className="w-5 h-5 animate-pulse" />
          ) : state === 'denied' || state === 'error' ? (
            <BellOff className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-xs font-bold tracking-widest mb-1 ${
            state === 'subscribed' ? 'text-vm-green' :
            state === 'denied' || state === 'error' ? 'text-vm-red' :
            'text-gold'
          }`}>
            {state === 'subscribed' && 'PUSH ALERTS ACTIVE'}
            {state === 'denied' && 'NOTIFICATIONS BLOCKED'}
            {state === 'error' && 'NOTIFICATION ERROR'}
            {(state === 'idle' || state === 'requesting') && 'ENABLE NATIVE NOTIFICATIONS'}
          </h3>

          <p className="text-[11px] text-text-dim leading-relaxed">
            {state === 'idle' && 'Receive alerts directly from Virtual Mind — no Telegram, no Discord. Pure native OS-level push notifications, even when the app is closed.'}
            {state === 'requesting' && 'Awaiting your permission...'}
            {state === 'subscribed' && 'Virtual Mind will alert you at 21:30 and 22:30 if your daily reflection is not secured. Tap any notification to open the app.'}
            {state === 'denied' && 'Go to your browser settings and allow notifications for this site to re-enable alerts.'}
            {state === 'error' && statusMsg}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(state === 'idle' || state === 'requesting') && (
              <button
                id="push-subscribe-btn"
                onClick={handleSubscribe}
                disabled={state === 'requesting' || !swReady}
                className="px-4 py-2 bg-gold/10 border border-gold/40 text-gold text-xs font-bold tracking-widest hover:bg-gold/20 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {state === 'requesting' ? (
                  <>
                    <span className="w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin" />
                    REQUESTING...
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    ACTIVATE ALERTS
                  </>
                )}
              </button>
            )}

            {state === 'subscribed' && (
              <>
                <button
                  id="push-test-btn"
                  onClick={handleSendTest}
                  className="px-3 py-1.5 bg-vm-green/10 border border-vm-green/30 text-vm-green text-[10px] font-bold tracking-widest hover:bg-vm-green/20 transition-colors flex items-center gap-1.5"
                >
                  {testSent ? (
                    <><CheckCircle className="w-3 h-3" /> SENT!</>
                  ) : (
                    <><BellRing className="w-3 h-3" /> TEST ALERT</>
                  )}
                </button>
                <button
                  id="push-unsubscribe-btn"
                  onClick={handleUnsubscribe}
                  className="px-3 py-1.5 border border-surface2 text-text-dim text-[10px] tracking-widest hover:border-vm-red/30 hover:text-vm-red transition-colors"
                >
                  DISABLE
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
