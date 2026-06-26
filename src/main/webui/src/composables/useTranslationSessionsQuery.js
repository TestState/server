import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useTranslationSessionsQuery = () => useQuery({
  queryKey: ['translationSessions'],
  queryFn: () => safeFetch('/api/translations/sessions').then(res => {
    if (!Array.isArray(res)) {
      throw new Error("API returned invalid data format");
    }
    return res;
  })
});
