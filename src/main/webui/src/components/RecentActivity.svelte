<script>
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import { navigate } from '@/router.js';
  import { useBatchesQuery, useSessionsQuery } from '@/composables/queries';
  import { getCleanStatus, getStatusColor } from '@/utils/format';

  const batchesQuery = useBatchesQuery();
  const sessionsQuery = useSessionsQuery();

  let isLoading = $derived($batchesQuery.isPending || $sessionsQuery.isPending);
  let hasError = $derived($batchesQuery.error || $sessionsQuery.error);
  let errorMessage = $derived(() => {
    const err = $batchesQuery.error || $sessionsQuery.error;
    return err ? (err.message || String(err)) : '';
  });

  let batches = $derived($batchesQuery.data || []);
  let sessions = $derived($sessionsQuery.data || []);

  const getBadgePreset = (status) => {
    const col = getStatusColor(status);
    if (col === 'danger') return 'preset-filled-error-500';
    if (col === 'secondary') return 'preset-tonal-surface-500';
    if (col === 'success') return 'preset-filled-success-500';
    if (col === 'info') return 'preset-filled-primary-500';
    if (col === 'warning') return 'preset-filled-warning-500';
    return 'preset-tonal-surface-500';
  };
</script>

<div>
  {#if isLoading}
    <div class="flex justify-center py-6">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading recent activity:</span> {errorMessage()}
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Batches -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Batches</h2>
        
        {#if batches.length === 0}
          <p class="text-center text-sm text-surface-500 py-4">No batches</p>
        {:else}
          <div class="divide-y divide-surface-200 dark:divide-surface-800">
            {#each batches.slice(0, 8) as batch (batch.batchId)}
              <div class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-sm truncate text-surface-800 dark:text-surface-200" title={batch.testName}>
                    {batch.testName}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="font-mono text-xs text-surface-400">{batch.batchId}</span>
                    <span class="badge {getBadgePreset(batch.status)} text-[10px] px-1.5 py-0.5">
                      {getCleanStatus(batch.status)}
                    </span>
                  </div>
                </div>
                <button 
                  class="btn btn-sm preset-tonal-surface-500"
                  onclick={() => navigate(`/tests/batch/${batch.batchId}/status`)}
                >
                  Monitor
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Sessions -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Sessions</h2>
        
        {#if sessions.length === 0}
          <p class="text-center text-sm text-surface-500 py-4">No sessions</p>
        {:else}
          <div class="divide-y divide-surface-200 dark:divide-surface-800">
            {#each sessions.slice(0, 8) as session (session.sessionId)}
              <div class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-sm truncate text-surface-800 dark:text-gray-200" title={session.ticket?.testType || session.agentName}>
                    {session.ticket?.testType || session.agentName}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="font-mono text-xs text-surface-400">{session.sessionId}</span>
                    <span class="badge {getBadgePreset(session.status)} text-[10px] px-1.5 py-0.5">
                      {getCleanStatus(session.status)}
                    </span>
                  </div>
                </div>
                <button 
                  class="btn btn-sm preset-tonal-surface-500"
                  onclick={() => navigate(`/tests/session/${session.sessionId}/status`)}
                >
                  Inspect
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
