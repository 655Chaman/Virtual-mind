'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: any | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  useEffect(() => {
    // In production, this would use process.env.NEXT_PUBLIC_WS_URL
    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/frontend-client`);

    ws.onopen = () => {
      console.log('[WebSocket] Connected to Virtual Mind OS');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received:', data);
        setLastMessage(data);
        
        // If the backend broadcasts a LOG_CREATED event, trigger an OS-wide refresh or notification
        if (data.event === 'LOG_CREATED') {
          // Could trigger a toast or revalidate data here
          // For Android WebView, trigger native animation
          if (typeof window !== 'undefined' && (window as any).Android?.playSuccessAnimation) {
             (window as any).Android.playSuccessAnimation();
          }
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message', e);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected from OS');
      setIsConnected(false);
      // Implement reconnect logic here if needed
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
