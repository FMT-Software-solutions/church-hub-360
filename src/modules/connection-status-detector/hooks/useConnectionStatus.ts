import { useEffect } from 'react';
import { useConnectionStore } from '../stores/connectionStore';

// Helper to check if window is available (client-side)
const isBrowser = typeof window !== 'undefined';

export function useConnectionStatus() {
  const { isConnected, setConnectionStatus } = useConnectionStore();

  // Simple browser-native check
  const checkConnection = () => {
    if (!isBrowser) return;
    setConnectionStatus(navigator.onLine);
  };

  useEffect(() => {
    if (!isBrowser) return;

    // Initial check
    checkConnection();
    
    // Handle online/offline events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, [setConnectionStatus]);
  
  return isConnected;
} 