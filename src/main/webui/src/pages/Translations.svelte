<script>
  import { useTranslationSessionsQuery } from '@/composables/queries';
  import { getCleanStatus, getStatusColor } from '@/utils/format';
  import { navigate } from '@/router.js';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
import Plus from '@lucide/svelte/icons/plus';
import Loader2 from '@lucide/svelte/icons/loader-2';

  const sessionsQuery = useTranslationSessionsQuery();

  let isLoading = $derived(sessionsQuery.isPending);
  let hasError = $derived(sessionsQuery.error);
  let errorMessage = $derived(sessionsQuery.error?.message || String(sessionsQuery.error));
  let sessions = $derived(sessionsQuery.data || []);

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
    <h1 class="text-2xl font-bold tracking-tight">Translations</h1>
    <button 
      class="btn btn-sm preset-filled-primary-500 flex items-center gap-2"
      onclick={() => navigate('/translations/new')}
    >
      <Plus size={16} />
      New
    </button>
  </div>

  <!-- Content -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading sessions...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading translations:</span> {errorMessage}
    </div>
  {:else if sessions.length === 0}
    <div class="card p-8 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-center">
      <p class="text-surface-500 text-sm">No translation sessions.</p>
      <div class="flex justify-center mt-3">
        <button class="btn btn-sm preset-tonal-surface-500 btn-sm" onclick={() => navigate('/translations/new')}>
          Create New
        </button>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each sessions as session (session.sessionId)}
        <div class="card p-5 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm flex flex-col justify-between">
          <div class="space-y-4">
            <!-- Session Title & ID -->
            <div class="flex justify-between items-start gap-4">
              <div class="min-w-0">
                <h3 class="font-semibold text-base truncate text-surface-800 dark:text-surface-200" title={session.ticket?.testType || session.agentName}>
                  {session.ticket?.testType || session.agentName}
                </h3>
                <span class="font-mono text-xs text-surface-400 block mt-0.5 truncate">
                  {session.sessionId}
                </span>
              </div>
              <span class="badge {getBadgePreset(session.status)} text-[10px] px-1.5 py-0.5 font-semibold">
                {getCleanStatus(session.status)}
              </span>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-2 gap-2 text-xs text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-950 p-2.5 rounded-lg border border-surface-250 dark:border-surface-850">
              <div>
                <span class="text-surface-400 block">Agent ID:</span>
                <span class="font-medium text-surface-950 dark:text-white">{session.agentId || 'N/A'}</span>
              </div>
              <div>
                <span class="text-surface-400 block">Agent Name:</span>
                <span class="font-medium text-surface-950 dark:text-white truncate block" title={session.agentName}>
                  {session.agentName || 'N/A'}
                </span>
              </div>
            </div>

            <!-- Status Message -->
            <div class="flex items-center gap-1.5 min-w-0">
              <span 
                class="inline-block w-1.5 h-1.5 rounded-full shrink-0 {session.status === 'RUNNING' ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'}"
              ></span>
              {#if session.statusMessage}
                <span class="text-xs text-surface-400 truncate" title={session.statusMessage}>
                  {session.statusMessage}
                </span>
              {/if}
            </div>
          </div>
          
          <hr class="my-4 border-surface-250 dark:border-surface-800" />
          
          <div class="flex justify-end">
            <button 
              class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1"
              onclick={() => navigate(`/translations/${session.sessionId}/status`)}
            >
              <span>Monitor</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
