<script>
  import { getCleanStatus, getDisplayDuration, getStatusColor } from '@/utils/format';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
import ChevronRight from '@lucide/svelte/icons/chevron-right';

  let { reports } = $props();

  let expandedSteps = $state({});

  const toggleStep = (stepName) => {
    expandedSteps[stepName] = !expandedSteps[stepName];
  };

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

{#if reports.length > 0}
  <div class="space-y-2 pt-4">
    <h3 class="font-semibold text-sm">Execution Steps</h3>
    <div class="space-y-2">
      {#each reports as step, idx (idx)}
        <div class="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-900">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="flex justify-between items-center p-3 cursor-pointer select-none hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            onclick={() => toggleStep(step.name)}
          >
            <div class="flex items-center gap-2">
              <span class="badge {getBadgePreset(step.status)} text-[10px] px-1.5 py-0.5 font-semibold">
                {getCleanStatus(step.status || 'PENDING')}
              </span>
              <span class="font-bold text-sm text-surface-900 dark:text-white">{step.name || 'Unnamed Step'}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-surface-500">{getDisplayDuration(step.summary?.totalDuration ?? 0)}</span>
              {#if expandedSteps[step.name]}
                <ChevronDown size={16} class="text-surface-500" />
              {:else}
                <ChevronRight size={16} class="text-surface-500" />
              {/if}
            </div>
          </div>

          {#if expandedSteps[step.name]}
            <div class="p-4 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 space-y-3">
              {#if step.summary?.metadata && Object.keys(step.summary.metadata).length > 0}
                <pre class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">{JSON.stringify(step.summary.metadata, null, 2)}</pre>
              {/if}

              <!-- Substeps -->
              {#if step.steps && step.steps.length > 0}
                <div class="pl-3 border-l-2 border-surface-200 dark:border-surface-800 space-y-2">
                  {#each step.steps as subStep, sIdx (sIdx)}
                    <div class="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-900">
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div 
                        class="flex justify-between items-center p-2.5 cursor-pointer select-none hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                        onclick={() => toggleStep(subStep.name)}
                      >
                        <div class="flex items-center gap-2">
                          <span class="badge {getBadgePreset(subStep.status)} text-[10px] px-1.5 py-0.5 font-semibold">
                            {getCleanStatus(subStep.status || 'PENDING')}
                          </span>
                          <span class="font-semibold text-xs text-surface-850 dark:text-gray-100">{subStep.name || 'Unnamed Substep'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-xs text-surface-500">{getDisplayDuration(subStep.summary?.totalDuration ?? 0)}</span>
                          {#if expandedSteps[subStep.name]}
                            <ChevronDown size={14} class="text-surface-500" />
                          {:else}
                            <ChevronRight size={14} class="text-surface-500" />
                          {/if}
                        </div>
                      </div>
                      {#if expandedSteps[subStep.name]}
                        <div class="p-3 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
                          {#if subStep.summary?.metadata && Object.keys(subStep.summary.metadata).length > 0}
                            <pre class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">{JSON.stringify(subStep.summary.metadata, null, 2)}</pre>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
