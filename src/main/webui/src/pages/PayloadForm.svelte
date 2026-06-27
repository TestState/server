<script>
  import { createQuery, createMutation } from '@/composables/queries.svelte';
  import { safeFetch } from '@/utils/safeFetch';
  import { navigate, route } from '@/router.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Save from '@lucide/svelte/icons/save';
import Loader2 from '@lucide/svelte/icons/loader-2';

  let id = $derived(route.params.id);

  const isEdit = $derived(!!id);

  let name = $state('');
  let description = $state('');
  let type = $state('');
  let metadata = $state('');
  let attachmentFile = $state(null);
  let errorMsg = $state(null);

  // Queries
  const availableTypes = createQuery('/api/payloads/available-types');
  const mimeMappings = createQuery('/api/payloads/mime-mappings');
  const entity = createQuery(() => `/api/payloads/${id}`, () => isEdit);

  let types = $derived(availableTypes.data || []);
  let mappings = $derived(mimeMappings.data || {});

  $effect(() => {
    if (entity.data) {
      name = entity.data.name || '';
      description = entity.data.description || '';
      type = entity.data.type || '';
      metadata = entity.data.metadata || '';
    }
  });

  const saveMutation = createMutation(
    (payloadForm) => {
      const url = isEdit ? `/api/payloads/${id}` : '/api/payloads';
      const method = isEdit ? 'PUT' : 'POST';
      return safeFetch(url, {
        method: method,
        body: payloadForm
      });
    },
    {
      onSuccess: () => {
        navigate('/payloads');
      },
      onError: (err) => {
        errorMsg = err.message;
      }
    }
  );

  const handleFileChange = (e) => {
    attachmentFile = e.target.files[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !type) return;

    let metaJson = {};
    if (metadata) {
      try {
        metaJson = JSON.parse(metadata);
      } catch {
        errorMsg = 'Invalid metadata JSON format';
        return;
      }
    }

    errorMsg = null;

    const payloadForm = new FormData();
    payloadForm.append('name', name);
    payloadForm.append('description', description);
    payloadForm.append('type', type);
    payloadForm.append('metadata', JSON.stringify(metaJson));

    if (attachmentFile) {
      payloadForm.append('attachmentFile', attachmentFile);
    }

    saveMutation.mutate(payloadForm);
  };

  let isLoading = $derived(entity.isPending && isEdit);
</script>

<div class="max-w-3xl mx-auto w-full space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold tracking-tight">
      {isEdit ? 'Edit Payload' : 'New Payload'}
    </h1>
    <button 
      class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
      onclick={() => navigate('/payloads')}
    >
      <ArrowLeft size={16} />
      Return
    </button>
  </div>

  <!-- Error Banner -->
  {#if errorMsg}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      {errorMsg}
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading Form data...</p>
    </div>
  {:else}
    <form class="space-y-6" onsubmit={handleSubmit}>
      <!-- Settings Card -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Settings</h2>

        <div class="space-y-4">
          <div class="w-full">
            <label for="payload-name" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Name <span class="text-error-500">*</span></label>
            <input
              id="payload-name"
              type="text"
              bind:value={name}
              placeholder="Enter payload name"
              required
              class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
            />
          </div>

          <div class="w-full">
            <label for="payload-description" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Description</label>
            <textarea
              id="payload-description"
              bind:value={description}
              placeholder="Enter description"
              rows="2"
              class="textarea p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
            ></textarea>
          </div>

          <div class="w-full">
            <label for="payload-type" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Type <span class="text-error-500">*</span></label>
            <input
              id="payload-type"
              type="text"
              bind:value={type}
              placeholder="Select or enter payload type"
              required
              class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
              list="available-types"
            />
            <datalist id="available-types">
              {#each types as item (item)}
                <option value={item}></option>
              {/each}
            </datalist>
          </div>

          <div class="w-full">
            <label for="payload-metadata" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">Metadata</label>
            <textarea
              id="payload-metadata"
              bind:value={metadata}
              placeholder={'{ "key": "value" }'}
              rows="5"
              class="textarea p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full font-mono text-xs"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- File Card -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">File</h2>

        <div class="space-y-4">
          {#if isEdit && entity.data?.attachmentName}
            <div class="flex items-center gap-2 text-sm">
              <span class="text-surface-500">Current Asset:</span>
              <span class="font-semibold text-surface-900 dark:text-white">{entity.data.attachmentName}</span>
            </div>
          {/if}

          <div class="w-full">
            <label for="payload-file" class="block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300">
              <span>Upload File</span>
              {#if type && mappings[type] && mappings[type].length > 0}
                <span class="float-right text-xs text-surface-500">
                  Supported formats for {type}: {mappings[type].join(', ')}
                </span>
              {/if}
            </label>
            <input
              id="payload-file"
              type="file"
              class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full"
              onchange={handleFileChange}
            />
          </div>
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
  {/if}
</div>
