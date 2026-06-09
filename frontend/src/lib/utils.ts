/**
 * Utility functions for Virtual Mind Frontend
 */

declare global {
  interface Window {
    Android?: {
      vibrate: (duration: number) => void;
      showNotification: (title: string, message: string) => void;
      triggerAlarmNotification: (title: string, message: string) => void;
    };
  }
}

/**
 * Triggers a haptic vibration on the device.
 * Prioritizes the native Android bridge if available, otherwise falls back to Web API.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
  // Define durations for different types of feedback
  const patterns = {
    light: 20,
    medium: 40,
    heavy: 80,
    success: [30, 50, 40] // array of durations/pauses for web fallback
  };

  const pattern = patterns[type];

  // Try Native Android Bridge first (zero latency)
  if (typeof window !== 'undefined' && window.Android && typeof window.Android.vibrate === 'function') {
    try {
      if (Array.isArray(pattern)) {
        // Simple fallback for arrays on native bridge: just do a longer vibrate
        window.Android.vibrate(100);
      } else {
        window.Android.vibrate(pattern);
      }
      return;
    } catch (e) {
      console.warn('Native haptic failed, falling back to web API', e);
    }
  }

  // Fallback to Web Vibration API if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore if browser blocks it (e.g. requires user gesture)
    }
  }
};
