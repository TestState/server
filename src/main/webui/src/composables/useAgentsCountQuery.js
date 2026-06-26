import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useAgentsCountQuery = () => useQuery({
  queryKey: ['agents-count'],
  queryFn: () => safeFetch('/api/agents/count')
});
