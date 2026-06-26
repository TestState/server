import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useTestsCountQuery = () => useQuery({
  queryKey: ['tests-count'],
  queryFn: () => safeFetch('/api/tests/count')
});
