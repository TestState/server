import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useSessionsQuery = () => useQuery({
  queryKey: ['sessions'],
  queryFn: () => safeFetch('/api/tests/sessions')
});
