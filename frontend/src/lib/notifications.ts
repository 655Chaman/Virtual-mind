/**
 * Virtual Mind — Notification Service
 *
 * Smart notification dispatch that prioritizes:
 * 1. Native Android bridge (window.Android.showNotification / triggerAlarmNotification)
 * 2. Web Notification API (if permission granted and browser supports it)
 * 3. Silent fallback (noop)
 *
 * PERSONALIZATION: All messages are addressed to "Deepaksh" by default.
 */

// Window.Android type is declared in @/lib/utils.ts

// ── Operator Identity ────────────────────────────────────────────────────────
export const OPERATOR_NAME = 'Chaman';

// ── Core Dispatch ────────────────────────────────────────────────────────────

/**
 * Sends a standard native notification.
 * Uses Android bridge first, then Web Notification API.
 */
export function triggerNativeNotification(title: string, body: string): void {
  // 1. Android native bridge (highest priority — direct OS notification)
  if (typeof window !== 'undefined' && window.Android?.showNotification) {
    try {
      window.Android.showNotification(title, body);
      return;
    } catch (e) {
      console.warn('[VM Notify] Android bridge failed:', e);
    }
  }

  // 2. Web Notification API fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
        });
      } catch (e) {
        console.warn('[VM Notify] Web Notification failed:', e);
      }
    }
  }
}

/**
 * Sends an ALARM-LEVEL notification for time-critical events (e.g. rest timer done).
 * Uses the dedicated alarm channel in Android (bypasses silent modes when possible).
 * Falls back to standard notification if alarm bridge not available.
 */
export function triggerAlarmNotification(title: string, body: string): void {
  // 1. Android alarm bridge
  if (typeof window !== 'undefined' && window.Android?.triggerAlarmNotification) {
    try {
      window.Android.triggerAlarmNotification(title, body);
      return;
    } catch (e) {
      console.warn('[VM Notify] Android alarm bridge failed, falling back:', e);
    }
  }

  // 2. Fallback to standard notification
  triggerNativeNotification(title, body);
}

/**
 * Multi-buzz vibration for alarms (200ms on, 100ms off, 200ms on, 100ms off, 200ms on)
 */
export function triggerAlarmVibration(): void {
  if (typeof window === 'undefined') return;

  // Android bridge
  if (window.Android?.vibrate) {
    try {
      // Fire 3 pulses with JavaScript delays
      window.Android.vibrate(300);
      setTimeout(() => window.Android?.vibrate(300), 450);
      setTimeout(() => window.Android?.vibrate(400), 900);
      return;
    } catch (e) {
      console.warn('[VM Notify] Android vibrate failed:', e);
    }
  }

  // Web Vibration API
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 400]);
    } catch (e) {
      // Silently ignore
    }
  }
}

// ── Typed Notification Builders ───────────────────────────────────────────────

export const PrayerNotifications = {
  onTime: (prayer: string, time: string) =>
    triggerNativeNotification(
      ` ${prayer} — Time to Pray`,
      `${OPERATOR_NAME}, it's ${time}. ${prayer} time has arrived. Drop the dunya — your Salah awaits.`
    ),

  midtimeWarning: (prayer: string) =>
    triggerNativeNotification(
      ` ${prayer} — Half Time Remaining`,
      `${OPERATOR_NAME}, half of ${prayer}'s time has passed and you haven't logged it yet. Don't delay your Salah.`
    ),

  reminder: (prayer: string) =>
    triggerNativeNotification(
      ` ${prayer} Reminder`,
      `${OPERATOR_NAME}, ${prayer} time is approaching. Begin your wudu.`
    ),
};

export const WorkoutNotifications = {
  restComplete: (setNumber?: number) => {
    const setInfo = setNumber ? ` Set ${setNumber} complete.` : '';
    triggerAlarmNotification(
      ` Rest Complete`,
      `${OPERATOR_NAME},${setInfo} Rest period is over — step back to the bar. Let's go.`
    );
    triggerAlarmVibration();
  },

  sessionReminder: (splitName: string) =>
    triggerNativeNotification(
      ` Workout Time`,
      `${OPERATOR_NAME}, it's time for your ${splitName} session. The bar is waiting.`
    ),

  sessionComplete: (volume: number, duration: number) =>
    triggerNativeNotification(
      ` Session Logged`,
      `${OPERATOR_NAME}, ${duration} minutes of training done. ${volume}kg total volume. The Caliphate grows.`
    ),
};

export const WellnessNotifications = {
  hydrationReminder: (currentL: number, goalL: number) =>
    triggerNativeNotification(
      ` Hydration Check`,
      `${OPERATOR_NAME}, you've had ${currentL.toFixed(1)}L of ${goalL}L today. Drink water now.`
    ),

  fastingMilestone: (hours: number) =>
    triggerNativeNotification(
      ` Fasting Milestone`,
      `${OPERATOR_NAME}, you've been fasting for ${hours} hours. Discipline is the seed of excellence.`
    ),

  sleepWindow: () =>
    triggerNativeNotification(
      ` Sleep Window`,
      `${OPERATOR_NAME}, it's time to wind down. Log your reflection and secure your sleep protocol.`
    ),

  deepworkReminder: () =>
    triggerNativeNotification(
      ` Deep Work`,
      `${OPERATOR_NAME}, your deep work session is active. Stay focused — no distractions.`
    ),
};

export const DailyNotifications = {
  morningIntention: () =>
    triggerNativeNotification(
      ` Fajr Protocol`,
      `Bismillah, ${OPERATOR_NAME}. New day. What are your non-negotiables?`
    ),

  eveningReflection: () =>
    triggerNativeNotification(
      ` Reflection Unsecured`,
      `${OPERATOR_NAME}, your daily log is not secured yet. The Caliphate is built one day at a time.`
    ),
};
