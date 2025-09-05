// hooks/useSupabaseQuery.ts
import { useState, useEffect, useCallback } from 'react';
import { appCache } from '../../../lib/cache';

interface UseSupabaseQueryOptions<T> {
  key: string;
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

export function useSupabaseQuery<T>({
  key,
  queryFn,
//   staleTime = 30000, // 30 seconds
  cacheTime = 300000, // 5 minutes
  enabled = true,
  refetchOnWindowFocus = true,
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(true);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    try {
      setError(null);

      if (!force) {
        const cached = appCache.getStaleWhileRevalidate<T>(key);
        if (cached.data) {
          setData(cached.data);
          setIsStale(cached.isStale);
          
          if (!cached.isStale) {
            return;
          }
        }
      }

      setLoading(true);
      const result = await queryFn();
      
      appCache.set(key, result, cacheTime);
      setData(result);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, cacheTime, enabled]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale && enabled) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, isStale, enabled, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  };
}