<script>
  import { getCleanStatus, getStatusColor } from '@/utils/format';

  let { batch } = $props();

  let sessions = $derived(batch?.sessions || []);
  let total = $derived(batch?.iterations || 0);

  let passed = $derived(
    batch?.passedCount !== undefined 
      ? batch.passedCount 
      : sessions.filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length
  );

  let failed = $derived(
    batch?.failedCount !== undefined 
      ? batch.failedCount 
      : sessions.filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length
  );

  let running = $derived(
    batch?.runningCount !== undefined 
      ? batch.runningCount 
      : sessions.filter(s => s.status?.includes('RUNNING')).length
  );

  let pending = $derived(
    batch?.pendingCount !== undefined 
      ? batch.pendingCount 
      : Math.max(0, total - (passed + failed) - running)
  );

  let rate = $derived(
    typeof batch?.throughput === 'number' 
      ? batch.throughput.toFixed(2) 
      : batch?.throughput || '0.00'
  );

  let time = $derived(
    typeof batch?.averageNegotiationDuration === 'number' 
      ? batch.averageNegotiationDuration.toFixed(2) 
      : batch?.averageNegotiationDuration || '0.00'
  );

  const getBadgeClass = (status) => {
    const col = getStatusColor(status);
    if (col === 'danger') return 'badge-soft badge-error';
    if (col === 'secondary') return 'badge-soft badge-neutral';
    if (col === 'success') return 'badge-soft badge-success';
    if (col === 'info') return 'badge-soft badge-info';
    if (col === 'warning') return 'badge-soft badge-warning';
    return `badge-soft badge-${col}`;
  };
</script>

<div class="card bg-base-100 shadow-sm border border-base-300">
  <div class="card-body p-6">
    <h2 class="card-title text-base font-semibold mb-4">Progress</h2>

    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-base-content/40">Status</span>
        <span class="badge badge-sm {getBadgeClass(batch.status)} block mt-1">
          {getCleanStatus(batch.status)}
        </span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-base-content/40">Total</span>
        <span class="font-bold text-md block mt-1">{total}</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-success">Passed</span>
        <span class="font-bold text-md block mt-1 text-success">{passed}</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-error">Failed</span>
        <span class="font-bold text-md block mt-1 text-error">{failed}</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-warning">Running</span>
        <span class="font-bold text-md block mt-1 text-warning">{running}</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-base-content/40">Pending</span>
        <span class="font-bold text-md block mt-1">{pending}</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-base-content/40">Rate</span>
        <span class="font-bold text-md block mt-1">{rate}/m</span>
      </div>
      <div class="bg-base-200 border border-base-300 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
        <span class="text-xs uppercase font-bold text-base-content/40">Time</span>
        <span class="font-bold text-md block mt-1">{time}ms</span>
      </div>
    </div>

    <!-- Progress Bar -->
    {#if total > 0}
      <div class="w-full h-3.5 bg-base-300 rounded-full overflow-hidden flex mt-4 border border-base-300 shadow-inner">
        {#if passed > 0}
          <div style:width="{(passed / total) * 100}%" class="bg-success h-full" title="Passed: {passed}"></div>
        {/if}
        {#if failed > 0}
          <div style:width="{(failed / total) * 100}%" class="bg-error h-full" title="Failed: {failed}"></div>
        {/if}
        {#if running > 0}
          <div style:width="{(running / total) * 100}%" class="bg-warning h-full" title="Running: {running}"></div>
        {/if}
        {#if pending > 0}
          <div style:width="{(pending / total) * 100}%" class="bg-neutral-content h-full" title="Pending: {pending}"></div>
        {/if}
      </div>
    {/if}
  </div>
</div>
