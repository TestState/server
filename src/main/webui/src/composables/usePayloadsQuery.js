import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const usePayloadsQuery = () => useQuery({
  queryKey: ['payloads'],
  queryFn: () => safeFetch('/api/payloads').then(res => {
    if (!Array.isArray(res)) {
      throw new Error("API returned invalid data format");
    }
    return res;
  })
});
