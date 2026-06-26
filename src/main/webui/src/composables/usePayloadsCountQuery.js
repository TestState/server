import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const usePayloadsCountQuery = () => useQuery({
  queryKey: ['payloads-count'],
  queryFn: () => safeFetch('/api/payloads/count')
});
