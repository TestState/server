import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useSessionsCountQuery = () => useQuery({
  queryKey: ['sessions-count'],
  queryFn: () => safeFetch('/api/tests/sessions/count')
});
