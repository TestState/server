import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useTestSessionQuery = (sessionId) => useQuery({
  queryKey: ['testSession', sessionId],
  queryFn: () => safeFetch(`/api/tests/sessions/${sessionId}`),
  enabled: !!sessionId
});
