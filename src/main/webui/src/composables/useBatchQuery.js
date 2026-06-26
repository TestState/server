import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useBatchQuery = (batchId) => useQuery({
  queryKey: ['batch', batchId],
  queryFn: () => safeFetch(`/api/tests/batches/${batchId}`),
  enabled: !!batchId
});
