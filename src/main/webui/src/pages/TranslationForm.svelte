<script>
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { safeFetch } from '@/utils/safeFetch';
  import { navigate } from '@/router.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Play from '@lucide/svelte/icons/play';
import Loader2 from '@lucide/svelte/icons/loader-2';

  const queryClient = useQueryClient();
  let formError = $state(null);

  let agentId = $state('');
  let type = $state('');
  let payloadIds = $state([]);

  const agentsQuery = createQuery({
    queryKey: ['agents'],
    queryFn: () => safeFetch('/api/agents')
  });

  const payloadsQuery = createQuery({
    queryKey: ['payloads'],
    queryFn: () => safeFetch('/api/payloads')
  });

  const mutation = createMutation({
    mutationFn: (body) => safeFetch('/api/translations/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['translationsSessions'] });
      if (res.sessionId) {
        navigate(`/translations/${res.sessionId}/status`);
      }
    },
    onError: (err) => {
      formError = err.message;
    }
  });

  let agents = $derived($agentsQuery.data || []);
  let payloads = $derived($payloadsQuery.data || []);

  let currentAgent = $derived(agents.find(a => a.id === agentId));
  let currentTranslation = $derived(currentAgent?.supportedTranslations?.find(t => t.type === type));
  let allowedSources = $derived(currentTranslation?.sourcePayloadTypes || []);

  let filteredPayloads = $derived(
    type ? payloads.filter(p => allowedSources.includes(p.type)) : payloads
  );

  const handleAgentChange = () => {
    type = '';
    payloadIds = [];
  };

  const handleTypeChange = () => {
    payloadIds = [];
  };

  $effect(() => {
    if (type && payloadIds.length > 0) {
      const validIds = payloadIds.filter(id => {
        const p = payloads.find(x => x.id === id);
        return p && allowedSources.includes(p.type);
      });
      if (validIds.length !== payloadIds.length) {
        payloadIds = validIds;
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agentId) {
      formError = 'Please select a translation node.';
      return;
    }
    if (!type) {
      formError = 'Please select a translation type.';
      return;
    }
    formError = null;
    $mutation.mutate({
      agentId,
      type,
      payloadIds
    });
  };

  const handlePayloadCheck = (id, checked) => {
    if (checked) {
      if (!payloadIds.includes(id)) {
        payloadIds = [...payloadIds, id];
      }
    } else {
      payloadIds = payloadIds.filter(val => val !== id);
    }
  };

  let isLoading = $derived($agentsQuery.isPending || $payloadsQuery.isPending);
  let error = $derived(formError || $mutation.error?.message);

  let agentOptions = $derived(agents.map(a => ({ label: a.name, value: a.id })));
  let typeOptions = $derived((currentAgent?.supportedTranslations || []).map(t => ({ label: t.type, value: t.type })));
</script>

<div class="max-w-3xl mx-auto w-full space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold tracking-tight">New Translation</h1>
    <button 
      class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
      onclick={() => navigate('/translations')}
    >
      <ArrowLeft size={16} />
      Cancel
    </button>
  </div>

  <!-- Error Banner -->
  {#if error}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading translation profiles...</p>
    </div>
  {:else}
    <form class="space-y-6" onsubmit={handleSubmit}>
      <!-- Task Card -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Task</h2>

        <div class="space-y-4">
          <div class="w-full">
            <label for="translation-node" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Node <span class="text-error-500">*</span></label>
            <select 
              id="translation-node"
              bind:value={agentId}
              onchange={handleAgentChange}
              class="select p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
            >
              <option value="" disabled>Select translation node</option>
              {#each agentOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>

          <div class="w-full">
            <label for="translation-type" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Type <span class="text-error-500">*</span></label>
            <select 
              id="translation-type"
              bind:value={type}
              disabled={!agentId}
              onchange={handleTypeChange}
              class="select p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
            >
              <option value="" disabled>{agentId ? 'Select translation format type' : 'Select node first'}</option>
              {#each typeOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>

          {#if currentTranslation}
            <div class="flex items-center gap-2 font-mono text-xs mt-2">
              <span class="badge preset-filled-primary-500 text-[10px] px-1.5 py-0.5">
                {allowedSources.join(', ')}
              </span>
              <span class="text-surface-400">&rarr;</span>
              <span class="badge preset-filled-success-500 text-[10px] px-1.5 py-0.5">
                {currentTranslation.targetPayloadTypes?.join(', ')}
              </span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Payloads Card -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Payloads</h2>
        
        <div class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {#if filteredPayloads.length === 0}
            <p class="text-center text-sm text-surface-500 py-4">No compatible payloads.</p>
          {:else}
            <div class="space-y-2">
              {#each filteredPayloads as payload (payload.id)}
                {@const isChecked = payloadIds.includes(payload.id)}
                <div 
                  class="flex items-center justify-between p-3 rounded-lg border transition-colors {isChecked ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface-50 dark:bg-surface-950 border-surface-250 dark:border-surface-850'}"
                >
                  <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      class="checkbox accent-primary-500"
                      onchange={(e) => handlePayloadCheck(payload.id, e.target.checked)}
                    />
                    <div class="flex flex-col">
                      <span class="font-semibold text-sm text-surface-950 dark:text-white">{payload.name}</span>
                      <span class="font-mono text-xs text-surface-400">{payload.type}</span>
                    </div>
                  </label>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-sm preset-filled-primary-500 w-full flex justify-center gap-2"
        disabled={!type || $mutation.isPending}
      >
        {#if $mutation.isPending}
          <Loader2 class="animate-spin" size={18} />
        {:else}
          <Play size={18} />
        {/if}
        Start Translation
      </button>
    </form>
  {/if}
</div>
