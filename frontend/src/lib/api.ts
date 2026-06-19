const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8001`;
  }
  return 'http://127.0.0.1:8001';
};
export const API_BASE = getApiBase();

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || response.statusText);
  }

  return response.json();
}

export const getLocalDateString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const api = {
  // Global System Status
  status: () => request('/api/status'),
  
  // Logs & Streaks
  logs: {
    list: (days = 7) => request(`/api/logs/logs?last=${days}`),
    today: () => request('/api/logs/log/' + getLocalDateString()),
    submit: (data: any) => request('/api/logs/log', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    addEntry: (entry: { timestamp: string; pillar: string; text: string; image_url?: string }) => request('/api/logs/entry', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
    streak: () => request('/api/logs/streak'),
    nnSummary: () => request('/api/logs/non-negotiables/summary'),
    materials: () => request('/api/logs/self/materials'),
  },

  // Media
  media: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    }
  },

  // Flaws
  flaws: {
    list: () => request('/api/flaws'),
    heatmap: () => request('/api/flaws/heatmap'),
    trigger: (data: any) => request('/api/flaws/flaw-trigger', { method: 'POST', body: JSON.stringify(data) }),
    mostActive: () => request('/api/flaws/most-active'),
  },

  // Patterns & Weekly Mirror
  patterns: {
    latest: () => request('/api/analysis/patterns/latest'),
    analyze: () => request('/api/analysis/patterns/analyze', { method: 'POST' }),
  },

  // Operator
  operator: {
    getLog: () => request('/api/operator/log'),
    generate: () => request('/api/operator/generate', { method: 'POST' }),
    patterns: () => request('/api/operator/patterns'),
  },

  // Chat
  chat: (message: string) => request('/api/chat/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),

  // A.O.S. Protocol Engine
  aos: {
    status: (ramadan = false) => request(`/api/aos/status?ramadan=${ramadan}`),
    protocols: () => request('/api/aos/protocols'),
    streaks: () => request('/api/aos/streaks'),
    perks: () => request('/api/aos/perks'),
    penalties: () => request('/api/aos/penalties'),
  },

  // Elesium
  elesium: {
    summary: () => request('/api/elesium/summary'),
    metrics: () => request('/api/elesium/metrics'),
    progress: () => request('/api/elesium/progress'),
    updateMetrics: (data: any) => request('/api/elesium/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  },

  // XP Engine
  xp: {
    today: (ramadan = false) => request(`/api/xp/today?ramadan=${ramadan}`),
    history: (days = 30) => request(`/api/xp/history?days=${days}`),
    leaderboard: () => request('/api/xp/leaderboard'),
    penalties: () => request('/api/xp/penalties/active'),
    perks: () => request('/api/xp/perks'),
  },
  // History
  history: {
    pillars: (days = 30) => request(`/api/history/pillars?days=${days}`),
  },
  workout: {
    today: () => request('/api/workout/today'),
    session: {
      start: (targetDate?: string) => request(`/api/workout/session/start${targetDate ? `?target_date=${targetDate}` : ''}`, { method: 'POST' }),
    },
    log: async (data: any) => {
      try {
        return await request('/api/workout/log', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        if (typeof window !== 'undefined') {
          const queue = JSON.parse(localStorage.getItem('vm_offline_workout_queue') || '[]');
          queue.push(data);
          localStorage.setItem('vm_offline_workout_queue', JSON.stringify(queue));
          console.warn('[OFFLINE] Workout log queued locally.');
          return { success: true, offline: true, date: data.date };
        }
        throw err;
      }
    },
    history: (last = 30) => request(`/api/workout/history?last=${last}`),
    exerciseHistory: (exerciseName: string, targetDate?: string) => {
      const query = targetDate ? `?target_date=${targetDate}` : '';
      return request(`/api/workout/exercise/${encodeURIComponent(exerciseName)}${query}`);
    },
    heatmap: (days = 7) => request(`/api/workout/heatmap?days=${days}`),
    homeProtocol: {
      today: () => request('/api/workout/home-protocol/today'),
      increment: (variant: string, count: number = 1) => request('/api/workout/home-protocol/increment', {
        method: 'POST',
        body: JSON.stringify({ variant, count }),
      }),
      delete: (variant: string) => request('/api/workout/home-protocol/delete', {
        method: 'POST',
        body: JSON.stringify({ variant }),
      }),
      rename: (oldVariant: string, newVariant: string) => request('/api/workout/home-protocol/rename', {
        method: 'POST',
        body: JSON.stringify({ old_variant: oldVariant, new_variant: newVariant }),
      }),
      decrement: (variant: string, count: number = 1) => request('/api/workout/home-protocol/decrement', {
        method: 'POST',
        body: JSON.stringify({ variant, count }),
      }),
      reorder: (order: string[]) => request('/api/workout/home-protocol/reorder', {
        method: 'POST',
        body: JSON.stringify({ order }),
      }),
    },
  },
  // Wellness
  wellness: {
    sleep: {
      today: () => request('/api/wellness/sleep/today'),
      start: () => request('/api/wellness/sleep/start', { method: 'POST' }),
      stop: (clientTimestamp?: string) => request('/api/wellness/sleep/stop', { 
        method: 'POST',
        body: JSON.stringify({ client_timestamp: clientTimestamp || null })
      }),
      history: (days = 30) => request(`/api/wellness/sleep/history?days=${days}`),
      progress: (range = '30d') => request(`/api/wellness/sleep/progress?range=${range}`),
    },
    fast: {
      today: () => request('/api/wellness/fast/today'),
      start: () => request('/api/wellness/fast/start', { method: 'POST' }),
      stop: (clientTimestamp?: string) => request('/api/wellness/fast/stop', { 
        method: 'POST',
        body: JSON.stringify({ client_timestamp: clientTimestamp || null })
      }),
      history: (days = 30) => request(`/api/wellness/fast/history?days=${days}`),
      progress: (range = '30d') => request(`/api/wellness/fast/progress?range=${range}`),
    },
    hydration: {
      today: () => request('/api/wellness/hydration/today'),
      add: (amount_ml: number) => request('/api/wellness/hydration/add', {
        method: 'POST',
        body: JSON.stringify({ amount_ml })
      }),
      history: (days = 30) => request(`/api/wellness/hydration/history?days=${days}`),
      progress: (range = '30d') => request(`/api/wellness/hydration/progress?range=${range}`),
    },
    deepwork: {
      today: () => request('/api/wellness/deepwork/today'),
      start: (journal_entry: string) => request('/api/wellness/deepwork/start', { 
        method: 'POST',
        body: JSON.stringify({ journal_entry })
      }),
      stop: (label: string = '') => request('/api/wellness/deepwork/stop', {
        method: 'POST',
        body: JSON.stringify({ label })
      }),
      history: (days = 30) => request(`/api/wellness/deepwork/history?days=${days}`),
      progress: (range = '30d') => request(`/api/wellness/deepwork/progress?range=${range}`),
    },
    readiness: {
      today: () => request('/api/wellness/readiness/today'),
      submit: (data: any) => request('/api/wellness/readiness', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      history: (days = 30) => request(`/api/wellness/readiness/history?days=${days}`),
      progress: (range = '30d') => request(`/api/wellness/readiness/progress?range=${range}`),
    }
  },
  // Sleep Protocol (Digital Sunset)
  sleepProtocol: {
    status: () => request('/api/sleep-protocol/status'),
    configure: (data: { bedtime_hour: number; wake_hour: number }) => request('/api/sleep-protocol/configure', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    override: (reason: string) => request('/api/sleep-protocol/override', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    compliance: (range = '30d') => request(`/api/sleep-protocol/compliance?range=${range}`),
  },
  deen: {
    prayerTimes: (lat?: number, lng?: number) => {
      const query = lat !== undefined && lng !== undefined ? `?latitude=${lat}&longitude=${lng}` : '';
      return request(`/api/deen/prayer-times${query}`);
    },
    logPrayers: async (data: any) => {
      try {
        return await request('/api/deen/prayers/log', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        if (typeof window !== 'undefined') {
          const queue = JSON.parse(localStorage.getItem('vm_offline_prayer_queue') || '[]');
          queue.push(data);
          localStorage.setItem('vm_offline_prayer_queue', JSON.stringify(queue));
          console.warn('[OFFLINE] Prayer log queued locally.');
          return { success: true, offline: true };
        }
        throw err;
      }
    },
    prayerHistory: (days = 14) => request(`/api/deen/prayers/history?days=${days}`),
    logTasbih: async (data: any) => {
      try {
        return await request('/api/deen/tasbih', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        if (typeof window !== 'undefined') {
          const queue = JSON.parse(localStorage.getItem('vm_offline_tasbih_queue') || '[]');
          queue.push(data);
          localStorage.setItem('vm_offline_tasbih_queue', JSON.stringify(queue));
          console.warn('[OFFLINE] Tasbih log queued locally.');
          return { success: true, offline: true };
        }
        throw err;
      }
    },
    tasbihHistory: () => request('/api/deen/tasbih'),
  },
  // Qadr Protocol (AI Night Planner)
  qadr: {
    context: () => request('/api/qadr/context'),
    answer: (session_id: number, question_id: string, answer: string) => request('/api/qadr/answer', {
      method: 'POST',
      body: JSON.stringify({ session_id, question_id, answer }),
    }),
    questions: (session_id: number) => request(`/api/qadr/questions/${session_id}`),
    generate: (session_id: number) => request('/api/qadr/generate', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    }),
    select: (session_id: number, schedule_id: number) => request('/api/qadr/select', {
      method: 'POST',
      body: JSON.stringify({ session_id, schedule_id }),
    }),
    active: () => request('/api/qadr/active'),
    history: (days = 14) => request(`/api/qadr/history?days=${days}`),
  },
  // Graveyard
  graveyard: {
    list: () => request('/api/graveyard/'),
    touch: (id: string) => request(`/api/graveyard/${id}/touch`, { method: 'POST' }),
    kill: (id: string, post_mortem: string) => request(`/api/graveyard/${id}/kill`, {
      method: 'POST',
      body: JSON.stringify({ post_mortem })
    }),
  },
  // Newspaper
  newspaper: {
    get: () => request('/api/newspaper/'),
    generate: () => request('/api/newspaper/generate', { method: 'POST' }),
  },
};
export const syncOfflineWorkouts = async () => {
  if (typeof window === 'undefined') return;
  const queue = JSON.parse(localStorage.getItem('vm_offline_workout_queue') || '[]');
  if (queue.length === 0) return;
  
  console.log(`[SYNC] Found ${queue.length} offline workouts. Syncing...`);
  const failed = [];
  for (const data of queue) {
    try {
      await request('/api/workout/log', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log(`[SYNC] Successfully synced workout for ${data.date}`);
    } catch (err) {
      console.error(`[SYNC] Failed to sync workout for ${data.date}`, err);
      failed.push(data);
    }
  }
  localStorage.setItem('vm_offline_workout_queue', JSON.stringify(failed));
};

export const syncOfflineDeen = async () => {
  if (typeof window === 'undefined') return;
  
  const prayerQueue = JSON.parse(localStorage.getItem('vm_offline_prayer_queue') || '[]');
  if (prayerQueue.length > 0) {
    console.log(`[SYNC] Found ${prayerQueue.length} offline prayers. Syncing...`);
    const failedPrayers = [];
    for (const data of prayerQueue) {
      try {
        await request('/api/deen/prayers/log', { method: 'POST', body: JSON.stringify(data) });
      } catch (err) {
        failedPrayers.push(data);
      }
    }
    localStorage.setItem('vm_offline_prayer_queue', JSON.stringify(failedPrayers));
  }

  const tasbihQueue = JSON.parse(localStorage.getItem('vm_offline_tasbih_queue') || '[]');
  if (tasbihQueue.length > 0) {
    console.log(`[SYNC] Found ${tasbihQueue.length} offline tasbih logs. Syncing...`);
    const failedTasbih = [];
    for (const data of tasbihQueue) {
      try {
        await request('/api/deen/tasbih', { method: 'POST', body: JSON.stringify(data) });
      } catch (err) {
        failedTasbih.push(data);
      }
    }
    localStorage.setItem('vm_offline_tasbih_queue', JSON.stringify(failedTasbih));
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineWorkouts);
  window.addEventListener('online', syncOfflineDeen);
  setTimeout(() => {
    syncOfflineWorkouts();
    syncOfflineDeen();
  }, 2000); // Initial sync on load
}
