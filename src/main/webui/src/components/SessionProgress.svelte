<script>
  import { getCleanStatus, getStatusColor } from '@/utils/format';

  let { session } = $props();

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

<div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
  <div class="flex justify-between items-center w-full mb-4">
    <h2 class="text-base font-semibold text-surface-900 dark:text-white">Progress</h2>
    <span class="badge {getBadgePreset(session.status)} text-[10px] px-1.5 py-0.5 font-semibold">
      {getCleanStatus(session.status)}
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
    <div class="flex flex-col gap-0.5">
      <span class="text-xs text-surface-500">Agent Name</span>
      <span class="font-semibold text-surface-900 dark:text-white">{session.agentName || 'N/A'}</span>
    </div>
    <div class="flex flex-col gap-0.5">
      <span class="text-xs text-surface-500">Agent ID</span>
      <span class="font-mono text-xs text-surface-400">{session.agentId || 'N/A'}</span>
    </div>
    <div class="flex flex-col gap-0.5">
      <span class="text-xs text-surface-500">Negotiation Time</span>
      <span class="font-semibold text-surface-900 dark:text-white">{session.negotiationDurationMs ? `${session.negotiationDurationMs} ms` : 'N/A'}</span>
    </div>
  </div>

  {#if session.statusMessage}
    <div class="alert preset-tonal-primary p-4 rounded-lg mt-4 text-sm">
      <span>{session.statusMessage}</span>
    </div>
  {/if}
</div>
