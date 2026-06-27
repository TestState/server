import { createQuery } from '@tanstack/svelte-query';
import { safeFetch } from '@/utils/safeFetch';

export const useAgentsCountQuery = () => createQuery(() => ({
  queryKey: ['agents-count'],
  queryFn: () => safeFetch('/api/agents/count')
}));

export const useAgentsQuery = () => createQuery(() => ({
  queryKey: ['agents'],
  queryFn: () => safeFetch('/api/agents')
}));

export const useBatchQuery = (batchId) => createQuery(() => {
  const id = typeof batchId === 'function' ? batchId() : batchId;
  return {
    queryKey: ['batch', id],
    queryFn: () => safeFetch(`/api/tests/batches/${id}`),
    enabled: !!id
  };
});

export const useBatchesQuery = () => createQuery(() => ({
  queryKey: ['batches'],
  queryFn: () => safeFetch('/api/tests/batches')
}));

export const usePayloadsCountQuery = () => createQuery(() => ({
  queryKey: ['payloads-count'],
  queryFn: () => safeFetch('/api/payloads/count')
}));

export const usePayloadsQuery = () => createQuery(() => ({
  queryKey: ['payloads'],
  queryFn: () => safeFetch('/api/payloads')
}));

export const usePerformanceStatsQuery = () => createQuery(() => ({
  queryKey: ['performance-stats'],
  queryFn: () => safeFetch('/api/tests/statistics')
}));

export const useSessionsCountQuery = () => createQuery(() => ({
  queryKey: ['sessions-count'],
  queryFn: () => safeFetch('/api/tests/sessions/count')
}));

export const useSessionsQuery = () => createQuery(() => ({
  queryKey: ['sessions'],
  queryFn: () => safeFetch('/api/tests/sessions')
}));

export const useTestSessionQuery = (sessionId) => createQuery(() => {
  const id = typeof sessionId === 'function' ? sessionId() : sessionId;
  return {
    queryKey: ['test-session', id],
    queryFn: () => safeFetch(`/api/tests/sessions/${id}`),
    enabled: !!id
  };
});

export const useTestsCountQuery = () => createQuery(() => ({
  queryKey: ['tests-count'],
  queryFn: () => safeFetch('/api/tests/count')
}));

export const useTestsQuery = () => createQuery(() => ({
  queryKey: ['tests'],
  queryFn: () => safeFetch('/api/tests')
}));

export const useTranslationSessionQuery = (sessionId) => createQuery(() => {
  const id = typeof sessionId === 'function' ? sessionId() : sessionId;
  return {
    queryKey: ['translation-session', id],
    queryFn: () => safeFetch(`/api/translations/sessions/${id}`),
    enabled: !!id
  };
});

export const useTranslationSessionsQuery = () => createQuery(() => ({
  queryKey: ['translation-sessions'],
  queryFn: () => safeFetch('/api/translations/sessions')
}));
