<script>
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import { safeFetch } from '@/utils/safeFetch';
  import { navigate, route } from '@/router.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Play from '@lucide/svelte/icons/play';
import Loader2 from '@lucide/svelte/icons/loader-2';

  let id = $derived(route.params.id);

  const contextQuery = createQuery({
    get queryKey() { return ['test-run-context', id]; },
    get queryFn() {
      return async () => {
        const [test, agents, payloads] = await Promise.all([
          safeFetch(`/api/tests/${id}`),
          safeFetch('/api/agents'),
          safeFetch('/api/payloads')
        ]);

        const compatibleTypes = new Set();
        agents.forEach(agent => {
          const t = agent.supportedTests?.find(st => st.testType === test.testType);
          if (t) {
            t.requiredPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
            t.optionalPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
          }
        });

        const linkedIds = new Set(test.payloads?.map(p => p.id) || []);
        const extraPayloads = payloads.filter(p => !linkedIds.has(p.id) && compatibleTypes.has(p.type));

        return { test, agents, extraPayloads };
      };
    }
  });

  let test = $derived($contextQuery.data?.test || {});
  let agents = $derived($contextQuery.data?.agents || []);
  let extraPayloads = $derived($contextQuery.data?.extraPayloads || []);

  let agentIds = $state([]);
  let extraPayloadIds = $state([]);
  let iterations = $state(1);
  let strategy = $state('sequential');
  let errorMsg = $state(null);

  $effect(() => {
    if (agents.length > 0) {
      const compatible = agents.filter(a => a.supportedTestTypes?.includes(test.testType));
      if (compatible.length > 0 && agentIds.length === 0) {
        agentIds = [compatible[0].id];
      }
    }
  });

  const runMutation = createMutation({
    mutationFn: (body) => safeFetch(`/api/tests/${id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      if (res.batchId) {
        navigate(`/tests/batch/${res.batchId}/status`);
      } else if (res.sessionId) {
        navigate(`/tests/session/${res.sessionId}/status`);
      }
    },
    onError: (err) => {
      errorMsg = 'Failed to trigger run: ' + err.message;
    }
  });

  const getPayloadRequirement = (payloadType) => {
    const ags = agents;
    const t = test;
    if (!ags || !t) return null;
    const requirements = new Map();
    ags.forEach(agent => {
      if (agentIds.length > 0 && !agentIds.includes(agent.id)) return;

      const st = agent.supportedTests?.find(tt => tt.testType === t.testType);
      if (st) {
        st.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
        st.optionalPayloadTypes?.forEach(o => {
          if (requirements.get(o) !== 'REQUIRED') {
            requirements.set(o, 'RECOMMENDED');
          }
        });
      }
    });
    return requirements.get(payloadType) || null;
  };

  const handleAgentCheck = (agentId, checked) => {
    if (checked) {
      if (!agentIds.includes(agentId)) {
        agentIds = [...agentIds, agentId];
      }
    } else {
      agentIds = agentIds.filter(id => id !== agentId);
    }
  };

  const handleExtraCheck = (extraId, checked) => {
    if (checked) {
      if (!extraPayloadIds.includes(extraId)) {
        extraPayloadIds = [...extraPayloadIds, extraId];
      }
    } else {
      extraPayloadIds = extraPayloadIds.filter(id => id !== extraId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    errorMsg = null;

    if (agentIds.length === 0) {
      errorMsg = 'Please select at least one agent node.';
      return;
    }

    $runMutation.mutate({
      agentIds,
      extraPayloadIds,
      iterations: parseInt(iterations) || 1,
      parallel: strategy === 'parallel'
    });
  };

  let isLoading = $derived($contextQuery.isPending);
  let hasError = $derived($contextQuery.isError);
  let errorMessage = $derived($contextQuery.error?.message || String($contextQuery.error));
</script>

<div class="max-w-3xl mx-auto w-full space-y-6">
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading Run context...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading run details:</span> {errorMessage}
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div class="space-y-0.5">
          <h1 class="text-2xl font-bold tracking-tight">New Test Session</h1>
          <p class="font-mono text-xs text-surface-400">{test.name}</p>
        </div>
        <button 
          class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
          onclick={() => navigate('/tests')}
        >
          <ArrowLeft size={16} />
          Return
        </button>
      </div>

      <!-- Error banner -->
      {#if errorMsg}
        <div class="alert preset-tonal-error p-4 rounded-lg">
          {errorMsg}
        </div>
      {/if}

      <form class="space-y-6" onsubmit={handleSubmit}>
        <!-- Nodes Selection Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Nodes</h2>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {#if agents.length === 0}
              <p class="text-center text-sm text-surface-500 py-4">No active agents.</p>
            {:else}
              <div class="space-y-2">
                {#each agents as agent (agent.id)}
                  {@const isCompatible = agent.supportedTestTypes?.includes(test.testType)}
                  {@const isChecked = agentIds.includes(agent.id)}
                  <div 
                    class="flex items-center justify-between p-3 rounded-lg border transition-colors {isChecked ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface-50 dark:bg-surface-950 border-surface-250 dark:border-surface-850'}"
                    style:opacity={isCompatible ? 1 : 0.5}
                  >
                    <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isCompatible}
                        class="checkbox accent-primary-500"
                        onchange={(e) => handleAgentCheck(agent.id, e.target.checked)}
                      />
                      <div class="flex flex-col">
                        <span class="font-semibold text-sm text-surface-950 dark:text-white">{agent.name}</span>
                        <span class="font-mono text-xs text-surface-400">{agent.id}</span>
                      </div>
                    </label>
                    <span class="badge {isCompatible ? 'preset-filled-success-500' : 'preset-filled-error-500'} shrink-0 text-[10px] px-1.5 py-0.5 font-semibold">
                      {isCompatible ? 'Ready' : 'Incompatible'}
                    </span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Settings Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Settings</h2>

          <div class="space-y-4">
            <div class="w-full">
              <label for="iterations" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Iterations</label>
              <input
                id="iterations"
                type="number"
                bind:value={iterations}
                min="1"
                max="1000"
                required
                class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
              />
            </div>

            <div class="w-full">
              <span class="block text-sm font-medium text-surface-900 dark:text-white mb-2">Strategy</span>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" name="strategy" value="sequential" bind:group={strategy} class="radio accent-primary-500" />
                  <span class="text-sm">Sequential</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" name="strategy" value="parallel" bind:group={strategy} class="radio accent-primary-500" />
                  <span class="text-sm">Parallel</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Payloads Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Linked Payloads</h2>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {#if !test.payloads || test.payloads.length === 0}
              <p class="text-center text-sm text-surface-500 py-4">No linked payloads.</p>
            {:else}
              <div class="divide-y divide-surface-200 dark:divide-surface-800">
                {#each test.payloads as payload (payload.id)}
                  <div class="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <span class="font-semibold text-sm text-surface-800 dark:text-surface-200">{payload.name}</span>
                    <span class="badge preset-filled-warning-500 text-[10px] px-1.5 py-0.5 font-semibold">{payload.type}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Extra Payloads Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Extra Payloads</h2>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {#if extraPayloads.length === 0}
              <p class="text-center text-sm text-surface-500 py-4">No compatible extras available.</p>
            {:else}
              <div class="space-y-2">
                {#each extraPayloads as payload (payload.id)}
                  {@const isChecked = extraPayloadIds.includes(payload.id)}
                  {@const req = getPayloadRequirement(payload.type)}
                  <div 
                    class="flex items-center justify-between p-3 rounded-lg border transition-colors {isChecked ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface-50 dark:bg-surface-950 border-surface-250 dark:border-surface-850'}"
                  >
                    <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        class="checkbox accent-primary-500"
                        onchange={(e) => handleExtraCheck(payload.id, e.target.checked)}
                      />
                      <div class="flex flex-col">
                        <span class="font-semibold text-sm text-surface-950 dark:text-white">{payload.name}</span>
                        <span class="font-mono text-xs text-surface-400">{payload.type}</span>
                      </div>
                    </label>
                    
                    {#if req}
                      <span class="badge {req === 'REQUIRED' ? 'preset-filled-error-500' : 'preset-filled-success-500'} shrink-0 text-[10px] px-1.5 py-0.5 font-semibold">
                        {req}
                      </span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-sm preset-filled-primary-500 w-full flex justify-center gap-2"
          disabled={$runMutation.isPending}
        >
          {#if $runMutation.isPending}
            <Loader2 class="animate-spin" size={18} />
          {:else}
            <Play size={18} />
          {/if}
          Start Run
        </button>
      </form>
    </div>
  {/if}
</div>
