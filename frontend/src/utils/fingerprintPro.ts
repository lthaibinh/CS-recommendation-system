/**
 * Fingerprint Pro Utilities
 * 
 * This module provides helper functions and types for working with
 * the Fingerprint Pro React SDK in your application.
 * 
 * Usage Example:
 * ```tsx
 * import { useFingerprint } from '@/utils/fingerprintPro';
 * 
 * function MyComponent() {
 *   const { visitorId, isLoading, error } = useFingerprint();
 *   // Use visitorId in your component
 * }
 * ```
 */

import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for easy access to Fingerprint Pro visitor data
 * 
 * @param options - Configuration options
 * @returns Visitor data, loading state, error state, and response time
 */
export function useFingerprint(options?: {
  extendedResult?: boolean;
  immediate?: boolean;
  logTiming?: boolean; // New option to log timing information
}) {
  const startTimeRef = useRef<number>(Date.now());
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  const { 
    isLoading, 
    error, 
    data, 
    getData 
  } = useVisitorData(
    { extendedResult: options?.extendedResult ?? true },
    { immediate: options?.immediate ?? true }
  );

  // Track when loading starts
  useEffect(() => {
    if (isLoading && !data) {
      startTimeRef.current = Date.now();
    }
  }, [isLoading, data]);

  // Calculate response time when data arrives
  useEffect(() => {
    if (data && !isLoading && startTimeRef.current) {
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;
      setResponseTime(duration);
      
      // Log timing if enabled
      if (options?.logTiming !== false) {
        console.log('⏱️ Fingerprint Pro Response Time:', {
          duration: `${duration}ms`,
          durationSeconds: `${(duration / 1000).toFixed(2)}s`,
          visitorId: data.visitorId?.substring(0, 15) + '...',
          confidence: data.confidence?.score,
          requestId: data.requestId,
          timestamp: new Date().toISOString(),
          details: data,
        });
      }
    }
  }, [data, isLoading, options?.logTiming]);

  return {
    visitorId: data?.visitorId,
    confidence: data?.confidence,
    requestId: data?.requestId,
    visitorFound: data?.visitorFound,
    ip: (data as any)?.ip,
    ipLocation: (data as any)?.ipLocation,
    browserDetails: (data as any)?.browserDetails,
    incognito: (data as any)?.incognito,
    bot: (data as any)?.bot,
    fullData: data,
    isLoading,
    error,
    getData,
    responseTime, // Response time in milliseconds
  };
}

/**
 * Helper function to check if the visitor is using incognito/private mode
 */
export function isIncognitoMode(data: any): boolean {
  return data?.incognito?.result === true;
}

/**
 * Helper function to check if the visitor is a bot
 */
export function isBot(data: any): boolean {
  return data?.bot?.result === 'bad' || data?.bot?.result === 'notDetected';
}

/**
 * Helper function to get a human-readable confidence level
 */
export function getConfidenceLevel(score: number): string {
  if (score >= 0.9) return 'Very High';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Medium';
  if (score >= 0.3) return 'Low';
  return 'Very Low';
}

/**
 * Format visitor data for API requests
 * This creates a consistent payload for your voting API
 */
export function formatFingerprintForAPI(data: any) {
  if (!data) return null;
  
  return {
    visitorId: data.visitorId,
    requestId: data.requestId,
    confidence: data.confidence?.score,
    ip: data.ip,
    timestamp: new Date().toISOString(),
  };
}

