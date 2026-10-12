import { executeClientApi, getStoredState } from '../services/localStorageService';

/**
 * Universal API Client for both Local Electron and Vercel React Web
 * If running on Vercel or static host where /api doesn't respond to a Node.js server,
 * it routes seamlessly to localStorageService with 0ms latency.
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
  // If window is defined and not running with an external backend or running on Vercel
  const isVercelOrStatic = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('localhost') && !window.location.port.includes('3001') ||
    window.location.protocol === 'file:' ||
    !navigator.onLine
  );

  // Attempt server fetch first if on a full stack host, otherwise fallback immediately to localStorage
  try {
    const res = await fetch(endpoint, options);
    if (res.ok) {
      return await res.json();
    }
    // If 404/500/offline (typical on Vercel static export), route to client storage
    return await executeClientApi(endpoint, options);
  } catch (err) {
    // Network error / offline / static deployment: seamlessly use local client storage
    return await executeClientApi(endpoint, options);
  }
}
