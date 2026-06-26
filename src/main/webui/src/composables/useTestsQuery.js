import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useTestsQuery = () => useQuery({
  queryKey: ['tests'],
  queryFn: () => safeFetch('/api/tests')
});
