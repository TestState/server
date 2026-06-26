import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

export const useTranslationSessionQuery = (sessionId) => useQuery({
  queryKey: ['translationSession', sessionId],
  queryFn: () => safeFetch(`/api/translations/sessions/${sessionId}`),
  enabled: !!sessionId
});
