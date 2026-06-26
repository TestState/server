import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useAgentsQuery = () => useQuery({
  queryKey: ['agents'],
  queryFn: () => safeFetch('/api/agents')
});
