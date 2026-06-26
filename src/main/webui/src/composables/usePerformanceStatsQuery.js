import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const usePerformanceStatsQuery = () => useQuery({
  queryKey: ['performance-stats'],
  queryFn: () => safeFetch('/api/tests/statistics')
});
