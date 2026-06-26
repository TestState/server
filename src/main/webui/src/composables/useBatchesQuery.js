import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useBatchesQuery = () => useQuery({
  queryKey: ['batches'],
  queryFn: () => safeFetch('/api/tests/batches')
});
