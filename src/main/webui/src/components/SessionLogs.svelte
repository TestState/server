<script>
  let { logs } = $props();
  let logsContainerRef = $state();

  $effect(() => {
    if (logs && logsContainerRef) {
      logsContainerRef.scrollTop = logsContainerRef.scrollHeight;
    }
  });
</script>

<div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
  <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Logs</h2>
  <div
    bind:this={logsContainerRef}
    class="bg-black p-4 rounded-lg border border-neutral-800 max-h-[250px] overflow-y-auto font-mono text-xs text-green-400"
  >
    {#if logs.length === 0}
      <div class="text-gray-600 italic">Awaiting telemetry logs...</div>
    {:else}
      <div>
        {#each logs as log, idx (idx)}
          {@const colorClass = log.level === 'ERROR' ? 'text-red-400' : (log.level === 'WARNING' ? 'text-yellow-400' : 'text-green-400')}
          <div class="mb-1 {colorClass}">
            [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level}] {log.message}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
