'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Pages that don't need the lock check
const EXEMPT_PATHS = ['/locked', '/log', '/'];

export function LockProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const didRedirect = useRef(false);

  useEffect(() => {
    // Don't gate exempt pages or the welcome screen
    if (EXEMPT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return;
    }

    const checkLock = async () => {
      try {
        const getApiBase = () => {
          if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8001`;
          }
          return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        };
        const API_BASE = getApiBase();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1500)
        );
        
        const fetchPromise = fetch(`${API_BASE}/api/status`);
        const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        if (!res.ok) return;
        const data = await res.json();
        
        // Minimal Mode check
        if (data.xp_balance < 0) {
          document.documentElement.classList.add('minimal-mode');
        } else {
          document.documentElement.classList.remove('minimal-mode');
        }

        if (data.is_locked && !didRedirect.current) {
          didRedirect.current = true;
          router.replace('/locked');
        }
      } catch (err) {
        console.warn('[LockProvider] Check failed or timed out:', err);
      }
    };

    checkLock();
  }, [pathname, router]);

  // ALWAYS render children immediately — never block rendering
  return <>{children}</>;
}
