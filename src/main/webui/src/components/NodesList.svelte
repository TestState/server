<script>
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import { useAgentsQuery } from '@/composables/queries';

  const agentsQuery = useAgentsQuery();

  let isLoading = $derived($agentsQuery.isPending);
  let hasError = $derived($agentsQuery.error);
  let errorMessage = $derived($agentsQuery.error?.message || String($agentsQuery.error));
  let agents = $derived($agentsQuery.data || []);

  const capBadgePreset = (agent, cap) => {
    if (agent.supportedTestTypes?.includes(cap)) return 'preset-filled-primary-500';
    if (agent.supportedTranslations?.some(t => t.type === cap)) return 'preset-filled-success-500';
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
      <span class="font-medium">Error loading nodes:</span> {errorMessage}
    </div>
  {:else}
    <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Nodes</h2>
      
      {#if agents.length === 0}
        <p class="text-center text-sm text-surface-500 py-4">No active nodes</p>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each agents as agent (agent.id)}
            <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 rounded-lg p-4 flex flex-col justify-between min-h-[120px]">
              <div class="space-y-2">
                <div>
                  <h3 class="font-semibold text-sm text-surface-900 dark:text-white">{agent.name}</h3>
                  <p class="font-mono text-xs text-surface-400 truncate" title={agent.id}>
                    {agent.id}
                  </p>
                </div>
                <hr class="my-2 border-surface-200 dark:border-surface-850" />
                <p class="text-xs font-bold text-surface-500 dark:text-surface-400">Capabilities:</p>
                <div class="flex flex-wrap gap-1">
                  {#each agent.capabilities || [] as cap (cap)}
                    <span class="badge {capBadgePreset(agent, cap)} text-[10px] px-1.5 py-0.5">
                      {cap}
                    </span>
                  {:else}
                    <span class="text-xs text-surface-400">None</span>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
