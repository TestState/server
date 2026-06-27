import { createQuery } from '@tanstack/svelte-query';
import { safeFetch } from '@/utils/safeFetch';

export const useAgentsCountQuery = () => createQuery({
  queryKey: ['agents-count'],
  queryFn: () => safeFetch('/api/agents/count')
});

export const useAgentsQuery = () => createQuery({
  queryKey: ['agents'],
  queryFn: () => safeFetch('/api/agents')
});

export const useBatchQuery = (batchId) => createQuery({
  get queryKey() { return ['batch', typeof batchId === 'function' ? batchId() : batchId]; },
  get queryFn() { return () => safeFetch(`/api/tests/batches/${typeof batchId === 'function' ? batchId() : batchId}`); }
});

export const useBatchesQuery = () => createQuery({
  queryKey: ['batches'],
  queryFn: () => safeFetch('/api/tests/batches')
});

export const usePayloadsCountQuery = () => createQuery({
  queryKey: ['payloads-count'],
  queryFn: () => safeFetch('/api/payloads/count')
});

export const usePayloadsQuery = () => createQuery({
  queryKey: ['payloads'],
  queryFn: () => safeFetch('/api/payloads')
});

export const usePerformanceStatsQuery = () => createQuery({
  queryKey: ['performance-stats'],
  queryFn: () => safeFetch('/api/tests/statistics')
});

export const useSessionsCountQuery = () => createQuery({
  queryKey: ['sessions-count'],
  queryFn: () => safeFetch('/api/tests/sessions/count')
});

export const useSessionsQuery = () => createQuery({
  queryKey: ['sessions'],
  queryFn: () => safeFetch('/api/tests/sessions')
});

export const useTestSessionQuery = (sessionId) => createQuery({
  get queryKey() { return ['test-session', typeof sessionId === 'function' ? sessionId() : sessionId]; },
  get queryFn() { return () => safeFetch(`/api/tests/sessions/${typeof sessionId === 'function' ? sessionId() : sessionId}`); }
});

export const useTestsCountQuery = () => createQuery({
  queryKey: ['tests-count'],
  queryFn: () => safeFetch('/api/tests/count')
});

export const useTestsQuery = () => createQuery({
  queryKey: ['tests'],
  queryFn: () => safeFetch('/api/tests')
});

export const useTranslationSessionQuery = (sessionId) => createQuery({
  get queryKey() { return ['translation-session', typeof sessionId === 'function' ? sessionId() : sessionId]; },
  get queryFn() { return () => safeFetch(`/api/translations/sessions/${typeof sessionId === 'function' ? sessionId() : sessionId}`); }
});

export const useTranslationSessionsQuery = () => createQuery({
  queryKey: ['translation-sessions'],
  queryFn: () => safeFetch('/api/translations/sessions')
});
