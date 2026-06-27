<script>
  import { useTestsQuery, useSessionsQuery, useBatchesQuery, createMutation } from '@/composables/queries.svelte';
  import { safeFetch } from '@/utils/safeFetch';
  import { getCleanStatus, getStatusColor } from '@/utils/format';
  import { navigate } from '@/router.js';
  import Plus from '@lucide/svelte/icons/plus';
import Play from '@lucide/svelte/icons/play';
import Copy from '@lucide/svelte/icons/copy';
import Edit from '@lucide/svelte/icons/edit';
import Trash from '@lucide/svelte/icons/trash';
import Loader2 from '@lucide/svelte/icons/loader-2';

  const testsQuery = useTestsQuery();
  const sessionsQuery = useSessionsQuery();
  const batchesQuery = useBatchesQuery();

  const deleteMutation = createMutation((id) => safeFetch(`/api/tests/${id}`, { method: 'DELETE' }), {
    onSuccess: () => {
      alert('Test configuration deleted successfully');
      testsQuery.refetch();
    },
    onError: (err) => {
      alert('Failed to delete test: ' + err.message);
    }
  });

  const copyMutation = createMutation((id) => safeFetch(`/api/tests/${id}/copy`, { method: 'POST' }), {
    onSuccess: () => {
      alert('Test configuration duplicated successfully');
      testsQuery.refetch();
    },
    onError: (err) => {
      alert('Failed to duplicate test: ' + err.message);
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this test configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  let isLoading = $derived(testsQuery.isPending || sessionsQuery.isPending || batchesQuery.isPending);
  let hasError = $derived(testsQuery.error || sessionsQuery.error || batchesQuery.error);
  let errorMessage = $derived(() => {
    const err = testsQuery.error || sessionsQuery.error || batchesQuery.error;
    return err ? (err.message || String(err)) : '';
  });

  let tests = $derived(testsQuery.data || []);
  let sessions = $derived(sessionsQuery.data || []);
  let batches = $derived(batchesQuery.data || []);

  let hasSessions = $derived(sessions.length > 0);
  let hasBatches = $derived(batches.length > 0);

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

<div class="space-y-6 w-full">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold tracking-tight">Tests</h1>
    <button 
      class="btn btn-sm preset-filled-primary-500 flex items-center gap-2"
      onclick={() => navigate('/tests/new')}
    >
      <Plus size={16} />
      New
    </button>
  </div>

  <!-- Content -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading test suites...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading tests:</span> {errorMessage()}
    </div>
  {:else}
    <div class="space-y-6">
      {#if tests.length === 0}
        <div class="card p-8 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-center">
          <p class="text-surface-500 text-sm">No tests configured.</p>
          <div class="flex justify-center mt-3">
            <button class="btn btn-sm preset-tonal-surface-500 btn-sm" onclick={() => navigate('/tests/new')}>Create New</button>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each tests as test (test.id)}
            <div class="card p-5 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm flex flex-col justify-between">
              <div class="space-y-3 flex-grow">
                <div class="flex justify-between items-start gap-4">
                  <h2 class="text-base font-bold truncate text-surface-900 dark:text-white" title={test.name}>
                    {test.name}
                  </h2>
                  <span class="badge preset-filled-primary-500 text-[10px] px-1.5 py-0.5 font-semibold">
                    {test.testType}
                  </span>
                </div>
                <p class="text-xs text-surface-400">
                  {test.payloads?.length || 0} linked
                </p>
                {#if test.description}
                  <p class="text-xs text-surface-500 dark:text-surface-400 line-clamp-3">
                    {test.description}
                  </p>
                {/if}
              </div>
              
              <hr class="my-4 border-surface-200 dark:border-surface-800" />
              
              <div class="flex flex-wrap justify-end items-center gap-2">
                <button 
                  class="btn btn-sm preset-filled-primary-500 flex items-center gap-1"
                  onclick={() => navigate(`/tests/${test.id}/run`)}
                >
                  <Play size={12} />
                  Run
                </button>
                <button 
                  class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1"
                  disabled={copyMutation.isPending && copyMutation.variables === test.id}
                  onclick={() => copyMutation.mutate(test.id)}
                >
                  <Copy size={12} />
                  Copy
                </button>
                <button 
                  class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1"
                  onclick={() => navigate(`/tests/${test.id}/edit`)}
                >
                  <Edit size={12} />
                  Edit
                </button>
                <button 
                  class="btn btn-sm preset-filled-error-500 flex items-center gap-1"
                  disabled={deleteMutation.isPending && deleteMutation.variables === test.id}
                  onclick={() => handleDelete(test.id)}
                >
                  <Trash size={12} />
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Batches and Sessions History -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {#if hasBatches}
          <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Batches</h2>
            
            <div class="divide-y divide-surface-200 dark:divide-surface-800">
              {#each batches as batch (batch.batchId)}
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
          </div>
        {/if}

        {#if hasSessions}
          <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Sessions</h2>
            
            <div class="divide-y divide-surface-200 dark:divide-surface-800">
              {#each sessions as session (session.sessionId)}
                <div class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                  <div class="min-w-0 flex-1">
                    <h3 class="font-semibold text-sm truncate text-surface-800 dark:text-surface-200" title={session.ticket?.testType || session.agentName}>
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
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
