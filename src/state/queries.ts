import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { loadCatalogIndex } from '../api/catalogIndex';
import { probeServices } from '../api/health';
import { getRequestLog, subscribeRequestLog } from '../api/requestLog';

export const CATALOG_KEY = ['catalog-index'] as const;

export function useCatalogIndex() {
  return useQuery({ queryKey: CATALOG_KEY, queryFn: loadCatalogIndex, staleTime: 60_000 });
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: probeServices, refetchInterval: 10_000, staleTime: 5_000 });
}

export function useRequestLog() {
  return useSyncExternalStore(subscribeRequestLog, getRequestLog);
}
