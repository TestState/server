<script>
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import {
    useTestsCountQuery,
    usePayloadsCountQuery,
    useAgentsCountQuery,
    useSessionsCountQuery,
    usePerformanceStatsQuery
  } from '@/composables/queries.svelte';

  const testsCount = useTestsCountQuery();
  const payloadsCount = usePayloadsCountQuery();
  const agentsCount = useAgentsCountQuery();
  const sessionsCount = useSessionsCountQuery();
  const stats = usePerformanceStatsQuery();

  let isLoading = $derived(
    testsCount.isPending ||
    payloadsCount.isPending ||
    agentsCount.isPending ||
    sessionsCount.isPending ||
    stats.isPending
  );

  let hasError = $derived(
    testsCount.error ||
    payloadsCount.error ||
    agentsCount.error ||
    sessionsCount.error ||
    stats.error
  );

  let errorMessage = $derived(() => {
    const err = testsCount.error || payloadsCount.error || agentsCount.error || sessionsCount.error || stats.error;
    return err ? (err.message || String(err)) : '';
  });

  let overviewStats = $derived([
    { title: 'Tests', value: testsCount.data ?? 0 },
    { title: 'Payloads', value: payloadsCount.data ?? 0 },
    { title: 'Nodes', value: agentsCount.data ?? 0 },
    { title: 'Sessions', value: sessionsCount.data ?? 0 },
    { title: 'Avg Time', value: `${Number(stats.data?.avgNegotiationTime ?? 0).toFixed(2)} ms` },
    { title: 'Rate', value: `${Number(stats.data?.throughput ?? 0).toFixed(2)}/m` }
  ]);
</script>

<div class="space-y-6 w-full">
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[100px] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading metrics...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading overview metrics:</span> {errorMessage()}
    </div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {#each overviewStats as stat (stat.title)}
        <div class="card p-4 text-center bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <span class="text-xs uppercase font-bold text-surface-500 dark:text-surface-400">{stat.title}</span>
          <span class="text-2xl font-bold block mt-1 text-surface-900 dark:text-white">{stat.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
