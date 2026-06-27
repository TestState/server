<script>
  import { onDestroy } from 'svelte';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { useBatchQuery } from '@/composables/queries';
  import { getCleanStatus, getStatusColor } from '@/utils/format';
  import { navigate, route } from '@/router.js';
  import { safeFetch } from '@/utils/safeFetch';
  import Download from '@lucide/svelte/icons/download';
import Code from '@lucide/svelte/icons/code';
import XCircle from '@lucide/svelte/icons/x-circle';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Loader2 from '@lucide/svelte/icons/loader-2';

  let batchId = $derived(route.params.batchId);

  const queryClient = useQueryClient();
  const batchQuery = useBatchQuery(() => batchId);

  let batch = $derived(batchQuery.data);
  let isLoading = $derived(batchQuery.isPending);
  let hasError = $derived(batchQuery.isError);
  let errorMessage = $derived(batchQuery.error?.message || String(batchQuery.error));

  let sessions = $derived(batch?.sessions || []);
  let isCancelable = $derived(batch && !batch.terminal);
  let cancelling = $state(false);

  let ws = null;
  let isConnectingOrConnected = false;

  const connectWebSocket = (b) => {
    if (b.terminal && !isConnectingOrConnected) {
      return;
    }

    if (!b.terminal && !isConnectingOrConnected) {
      isConnectingOrConnected = true;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/telemetry/test/batch/${batchId}`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'BATCH_UPDATE') {
            queryClient.setQueryData(['batch', batchId], prev => {
              if (!prev) return null;
              return {
                ...prev,
                status: msg.status,
                completed: msg.completed,
                throughput: Number(msg.throughput) || prev.throughput,
                averageNegotiationDuration: Number(msg.avgNegotiate) || prev.averageNegotiationDuration,
                terminal: msg.terminal,
                sessions: msg.sessions.map(s => ({
                  sessionId: s.sessionId,
                  status: s.state,
                  message: s.message,
                  agentId: s.agentId,
                  agentName: s.agentName,
                  negotiationDurationMs: s.negotiationDurationMs,
                  terminal: s.terminal
                }))
              };
            });
          } else if (msg.type === 'RESULT') {
            queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket encountered error", err);
      };
    }

    if (b.terminal && ws) {
      ws.close();
      ws = null;
      isConnectingOrConnected = false;
    }
  };

  $effect(() => {
    if (batch) {
      connectWebSocket(batch);
    }
  });

  const cleanupWS = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnectingOrConnected = false;
  };

  $effect(() => {
    if (batchId) {
      cleanupWS();
    }
  });

  onDestroy(() => {
    cleanupWS();
  });

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to stop this batch?')) {
      cancelling = true;
      try {
        await safeFetch(`/api/tests/batches/${batchId}/cancel`, { method: 'POST' });
        queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      } catch (err) {
        alert('Failed to stop batch: ' + err.message);
      } finally {
        cancelling = false;
      }
    }
  };

  let total = $derived(sessions.length);
  let passed = $derived(sessions.filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length);
  let failed = $derived(sessions.filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length);
  let running = $derived(sessions.filter(s => s.status?.includes('RUNNING') || s.status?.includes('NEGOTIATING')).length);
  let pending = $derived(sessions.filter(s => !s.status || s.status?.includes('PENDING')).length);

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
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="space-y-0.5">
      <h1 class="text-2xl font-bold tracking-tight">Batch Status</h1>
      <p class="font-mono text-xs text-surface-400">{batchId}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href="/api/tests/batches/{batchId}/report"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1.5"
      >
        <Download size={14} />
        <span>Export</span>
      </a>
      <a
        href="/api/tests/batches/{batchId}/report?full=true"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1.5"
      >
        <Code size={14} />
        <span>JSON</span>
      </a>
      {#if isCancelable}
        <button
          class="btn btn-sm preset-filled-error-500 flex items-center gap-1.5"
          disabled={cancelling}
          onclick={handleCancel}
        >
          {#if cancelling}
            <Loader2 class="animate-spin" size={14} />
          {:else}
            <XCircle size={14} />
          {/if}
          <span>Stop</span>
        </button>
      {/if}
      <button 
        onclick={() => navigate('/tests')}
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Return
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Waiting...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading batch status:</span> {errorMessage}
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Progress Section Inline -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Progress</h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-surface-400">Status</span>
            <span class="badge {getBadgePreset(batch.status)} mt-1 text-[10px] px-1.5 py-0.5">{getCleanStatus(batch.status)}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-surface-400">Total</span>
            <span class="font-bold text-md block mt-1 text-surface-900 dark:text-white">{total}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-green-500">Passed</span>
            <span class="font-bold text-md block mt-1 text-green-500">{passed}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-red-500">Failed</span>
            <span class="font-bold text-md block mt-1 text-red-500">{failed}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-yellow-500">Running</span>
            <span class="font-bold text-md block mt-1 text-yellow-500">{running}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-surface-400">Pending</span>
            <span class="font-bold text-md block mt-1 text-surface-900 dark:text-white">{pending}</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-surface-400">Rate</span>
            <span class="font-bold text-md block mt-1 text-surface-900 dark:text-white">{rate}/m</span>
          </div>
          <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 p-3 rounded-lg text-center shadow-sm flex flex-col justify-between items-center min-h-[70px]">
            <span class="text-xs uppercase font-bold text-surface-400">Time</span>
            <span class="font-bold text-md block mt-1 text-surface-900 dark:text-white">{time}ms</span>
          </div>
        </div>

        <!-- Progress Bar -->
        {#if total > 0}
          <div class="w-full h-3.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden flex mt-4 border border-surface-200 dark:border-surface-850 shadow-inner">
            {#if passed > 0}
              <div style:width="{(passed / total) * 100}%" class="bg-green-500 h-full" title="Passed: {passed}"></div>
            {/if}
            {#if failed > 0}
              <div style:width="{(failed / total) * 100}%" class="bg-red-500 h-full" title="Failed: {failed}"></div>
            {/if}
            {#if running > 0}
              <div style:width="{(running / total) * 100}%" class="bg-yellow-400 h-full" title="Running: {running}"></div>
            {/if}
            {#if pending > 0}
              <div style:width="{(pending / total) * 100}%" class="bg-surface-400 h-full" title="Pending: {pending}"></div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Sessions Section Inline -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Sessions</h2>
        
        {#if sessions.length === 0}
          <p class="text-center text-sm text-surface-500 py-4">No sessions active for this batch.</p>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each sessions as sess (sess.sessionId)}
              <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
                <div class="space-y-2 flex-grow">
                  <div class="flex justify-between items-start gap-4">
                    <h3 class="font-semibold text-sm truncate text-surface-850 dark:text-gray-250" title={sess.agentName}>
                      {sess.agentName}
                    </h3>
                    <span class="font-mono text-xs text-surface-400 shrink-0" title={sess.sessionId}>
                      {sess.sessionId.slice(0, 8)}...
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span class="badge {getBadgePreset(sess.status)} text-[10px] px-1.5 py-0.5 font-semibold">
                      {getCleanStatus(sess.status)}
                    </span>
                    {#if sess.negotiationDurationMs > 0}
                      <span class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-800 dark:text-surface-200">
                        {sess.negotiationDurationMs}ms
                      </span>
                    {/if}
                  </div>
                  {#if sess.message}
                    <p class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2" title={sess.message}>
                      {sess.message}
                    </p>
                  {/if}
                </div>
                
                <hr class="my-2 border-surface-200 dark:border-surface-850" />
                
                <div class="flex justify-end">
                  <button 
                    class="btn btn-sm preset-tonal-surface-500"
                    onclick={() => navigate(`/tests/session/${sess.sessionId}/status`)}
                  >
                    View
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
