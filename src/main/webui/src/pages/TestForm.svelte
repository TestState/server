<script>
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { safeFetch } from '@/utils/safeFetch';
  import { navigate, route } from '@/router.js';
  import Copy from '@lucide/svelte/icons/copy';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Save from '@lucide/svelte/icons/save';
import Loader2 from '@lucide/svelte/icons/loader-2';

  let id = $derived(route.params.id);

  const queryClient = useQueryClient();
  const isEdit = $derived(!!id);

  let name = $state('');
  let description = $state('');
  let testType = $state('');
  let payloadIds = $state([]);
  let errorMsg = $state(null);

  const contextQuery = createQuery(() => ({
    queryKey: ['test-form-context', id],
    queryFn: async () => {
      const [types, payloads, entity, agents] = await Promise.all([
        safeFetch('/api/tests/available-types'),
        safeFetch('/api/payloads'),
        isEdit ? safeFetch(`/api/tests/${id}`) : Promise.resolve(null),
        safeFetch('/api/agents')
      ]);
      return { types, payloads, entity, agents };
    }
  }));

  let availableTypes = $derived(contextQuery.data?.types || []);
  let allPayloads = $derived(contextQuery.data?.payloads || []);
  let entity = $derived(contextQuery.data?.entity);
  let agents = $derived(contextQuery.data?.agents || []);

  $effect(() => {
    if (entity) {
      name = entity.name || '';
      description = entity.description || '';
      testType = entity.testType || '';
      payloadIds = entity.payloads?.map(p => p.id) || [];
    }
  });

  const saveMutation = createMutation(() => ({
    mutationFn: (body) => {
      const url = isEdit ? `/api/tests/${id}` : '/api/tests';
      const method = isEdit ? 'PUT' : 'POST';
      return safeFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      navigate('/tests');
    },
    onError: (err) => {
      errorMsg = err.message;
    }
  }));

  const copyMutation = createMutation(() => ({
    mutationFn: () => safeFetch(`/api/tests/${id}/copy`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      navigate('/tests');
    },
    onError: (err) => {
      alert('Failed to duplicate test: ' + err.message);
    }
  }));

  const getPayloadRequirement = (payloadType) => {
    const tType = testType;
    const ags = agents;
    if (!tType || !ags) return null;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- ephemeral local Map, not reactive state
    const requirements = new Map();
    ags.forEach(agent => {
      const test = agent.supportedTests?.find(t => t.testType === tType);
      if (test) {
        test.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
        test.optionalPayloadTypes?.forEach(o => {
          if (requirements.get(o) !== 'REQUIRED') {
            requirements.set(o, 'RECOMMENDED');
          }
        });
      }
    });
    return requirements.get(payloadType) || null;
  };

  const handleCheck = (payloadId, checked) => {
    if (checked) {
      if (!payloadIds.includes(payloadId)) {
        payloadIds = [...payloadIds, payloadId];
      }
    } else {
      payloadIds = payloadIds.filter(val => val !== payloadId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    errorMsg = null;

    if (!name) {
      errorMsg = "Name is required";
      return;
    }
    if (!testType) {
      errorMsg = "Type is required";
      return;
    }

    saveMutation.mutate({
      name,
      description,
      testType,
      payloadIds
    });
  };

  let isLoading = $derived(contextQuery.isPending);
  let hasError = $derived(contextQuery.isError);
  let errorMessage = $derived(contextQuery.error?.message || String(contextQuery.error));
</script>

<div class="max-w-3xl mx-auto w-full space-y-6">
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading Form data...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading test data:</span> {errorMessage}
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Test' : 'New Test'}
        </h1>
        <div class="flex gap-2">
          {#if isEdit}
            <button
              class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
              disabled={copyMutation.isPending}
              onclick={() => copyMutation.mutate()}
            >
              {#if copyMutation.isPending}
                <Loader2 class="animate-spin" size={16} />
              {:else}
                <Copy size={16} />
              {/if}
              Copy
            </button>
          {/if}
          <button 
            class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
            onclick={() => navigate('/tests')}
          >
            <ArrowLeft size={16} />
            Return
          </button>
        </div>
      </div>

      <!-- Error banner -->
      {#if errorMsg}
        <div class="alert preset-tonal-error p-4 rounded-lg">
          {errorMsg}
        </div>
      {/if}

      <form class="space-y-6" onsubmit={handleSubmit}>
        <!-- Settings Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Settings</h2>

          <div class="space-y-4">
            <div class="w-full">
              <label for="test-name" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Name <span class="text-error-500">*</span></label>
              <input
                id="test-name"
                type="text"
                bind:value={name}
                placeholder="Enter test name"
                required
                class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
              />
            </div>

            <div class="w-full">
              <label for="test-description" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Description</label>
              <textarea
                id="test-description"
                bind:value={description}
                placeholder="Enter description"
                rows="3"
                class="textarea p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
              ></textarea>
            </div>

            <div class="w-full">
              <label for="test-type" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Type <span class="text-error-500">*</span></label>
              <input
                id="test-type"
                type="text"
                bind:value={testType}
                placeholder="Select or enter test type"
                required
                class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
                list="available-test-types"
              />
              <datalist id="available-test-types">
                {#each availableTypes as item (item)}
                  <option value={item}></option>
                {/each}
              </datalist>
            </div>
          </div>
        </div>

        <!-- Payloads Card -->
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Payloads</h2>

          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {#if allPayloads.length === 0}
              <div class="text-center py-6 text-sm text-surface-500">
                <span>Empty. </span>
                <button class="btn btn-sm preset-tonal-surface-500" onclick={() => navigate('/payloads/new')}>New</button>
              </div>
            {:else}
              <div class="space-y-2">
                {#each allPayloads as payload (payload.id)}
                  {@const isChecked = payloadIds.includes(payload.id)}
                  {@const req = getPayloadRequirement(payload.type)}
                  <div 
                    class="flex items-center justify-between p-3 rounded-lg border transition-colors {isChecked ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface-50 dark:bg-surface-950 border-surface-250 dark:border-surface-850'}"
                  >
                    <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        class="checkbox accent-primary-500"
                        onchange={(e) => handleCheck(payload.id, e.target.checked)}
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
          class="btn preset-filled-primary-500 w-full flex justify-center gap-2"
          disabled={saveMutation.isPending}
        >
          {#if saveMutation.isPending}
            <Loader2 class="animate-spin" size={18} />
          {:else}
            <Save size={18} />
          {/if}
          Save
        </button>
      </form>
    </div>
  {/if}
</div>
