import { safeFetch } from '@/utils/safeFetch';

export function createQuery(urlOrFn, enabledFn = () => true) {
  let data = $state(null);
  let isPending = $state(true);
  let isError = $state(false);
  let error = $state(null);

  const refetch = async () => {
    if (!enabledFn()) {
      isPending = false;
      return;
    }
    isPending = true;
    isError = false;
    error = null;
    try {
      if (typeof urlOrFn === 'function') {
        const res = urlOrFn();
        if (typeof res === 'string') {
          data = await safeFetch(res);
        } else {
          data = await res;
        }
      } else {
        data = await safeFetch(urlOrFn);
      }
    } catch (err) {
      isError = true;
      error = err;
    } finally {
      isPending = false;
    }
  };

  $effect(() => {
    refetch();
  });

  return {
    get data() { return data; },
    set data(val) { data = val; }, // Allow updating query data locally (e.g. for WS updates)
    get isPending() { return isPending; },
    get isError() { return isError; },
    get error() { return error; },
    refetch
  };
}

export function createMutation(mutationFn, options = {}) {
  let isPending = $state(false);
  let isError = $state(false);
  let error = $state(null);

  const mutate = async (variables) => {
    isPending = true;
    isError = false;
    error = null;
    try {
      const res = await mutationFn(variables);
      if (options.onSuccess) {
        options.onSuccess(res, variables);
      }
      return res;
    } catch (err) {
      isError = true;
      error = err;
      if (options.onError) {
        options.onError(err, variables);
      }
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    get isError() { return isError; },
    get error() { return error; },
    mutate
  };
}

export const useAgentsCountQuery = () => createQuery('/api/agents/count');
export const useAgentsQuery = () => createQuery('/api/agents');

export const useBatchQuery = (batchIdFn) => {
  return createQuery(
    () => `/api/tests/batches/${batchIdFn()}`,
    () => !!batchIdFn()
  );
};

export const useBatchesQuery = () => createQuery('/api/tests/batches');
export const usePayloadsCountQuery = () => createQuery('/api/payloads/count');
export const usePayloadsQuery = () => createQuery('/api/payloads');
export const usePerformanceStatsQuery = () => createQuery('/api/tests/statistics');
export const useSessionsCountQuery = () => createQuery('/api/tests/sessions/count');
export const useSessionsQuery = () => createQuery('/api/tests/sessions');

export const useTestSessionQuery = (sessionIdFn) => {
  return createQuery(
    () => `/api/tests/sessions/${sessionIdFn()}`,
    () => !!sessionIdFn()
  );
};

export const useTestsCountQuery = () => createQuery('/api/tests/count');
export const useTestsQuery = () => createQuery('/api/tests');

export const useTranslationSessionQuery = (sessionIdFn) => {
  return createQuery(
    () => `/api/translations/sessions/${sessionIdFn()}`,
    () => !!sessionIdFn()
  );
};

export const useTranslationSessionsQuery = () => createQuery('/api/translations/sessions');
