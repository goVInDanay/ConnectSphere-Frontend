import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage } from '../utils';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true }
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (options.immediate !== false) {
      fetch();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [...deps, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// Mutation hook for POST/PUT/DELETE operations
interface UseMutationState<TData, TInput> {
  mutate: (input: TInput) => Promise<TData | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<TData, TInput = void>(
  mutator: (input: TInput) => Promise<TData>
): UseMutationState<TData, TInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (input: TInput): Promise<TData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutator(input);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mutator]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, reset };
}
