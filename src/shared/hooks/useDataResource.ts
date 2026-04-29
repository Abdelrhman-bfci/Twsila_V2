import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStatus } from '@shared/components/StateView';

interface UseDataResourceOptions {
  /** When true, fetch immediately on mount. Defaults to true. */
  immediate?: boolean;
  /**
   * Predicate that decides whether the loaded data should be treated as
   * "empty" instead of "success". Defaults to: undefined / null / [].length === 0.
   */
  isEmpty?: (data: unknown) => boolean;
}

interface UseDataResourceResult<T> {
  data: T | null;
  status: ViewStatus;
  error: Error | null;
  /** True only while a refresh is in flight (data is already loaded). */
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

const defaultIsEmpty = (data: unknown): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
};

/**
 * Standardised loader for the screens. Owns the
 * idle / loading / error / empty / success state machine and exposes
 * a refresh() to drive RefreshControl, plus reload() for retry buttons.
 */
export function useDataResource<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: UseDataResourceOptions = {}
): UseDataResourceResult<T> {
  const { immediate = true, isEmpty = defaultIsEmpty } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<ViewStatus>(immediate ? 'loading' : 'idle');
  const [refreshing, setRefreshing] = useState(false);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: 'initial' | 'refresh' | 'reload') => {
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      setError(null);
      try {
        const result = await fetcher();
        if (!aliveRef.current) return;
        setData(result);
        setStatus(isEmpty(result) ? 'empty' : 'success');
      } catch (e) {
        if (!aliveRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus('error');
      } finally {
        if (aliveRef.current) setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetcher, isEmpty, ...deps]
  );

  useEffect(() => {
    if (immediate) run('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => run('refresh'), [run]);
  const reload = useCallback(() => run('reload'), [run]);

  return { data, status, error, refreshing, refresh, reload, setData };
}
