<script>
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { usePayloadsQuery } from '@/composables/queries';
  import { safeFetch } from '@/utils/safeFetch';
  import { navigate } from '@/router.js';
  import Plus from '@lucide/svelte/icons/plus';
import Download from '@lucide/svelte/icons/download';
import Edit from '@lucide/svelte/icons/edit';
import Trash from '@lucide/svelte/icons/trash';
import Loader2 from '@lucide/svelte/icons/loader-2';

  const queryClient = useQueryClient();
  const payloadsQuery = usePayloadsQuery();

  const deleteMutation = createMutation({
    mutationFn: (id) => safeFetch(`/api/payloads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      alert('Payload deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
    },
    onError: (err) => {
      alert('Failed to delete payload: ' + err.message);
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this payload?')) {
      $deleteMutation.mutate(id);
    }
  };

  const handleExport = (id, filename) => {
    const a = document.createElement('a');
    a.href = `/api/payloads/${id}/attachment`;
    a.download = filename || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  let isLoading = $derived($payloadsQuery.isPending);
  let hasError = $derived($payloadsQuery.error);
  let errorMessage = $derived($payloadsQuery.error?.message || String($payloadsQuery.error));
  let payloads = $derived($payloadsQuery.data || []);
</script>

<div class="space-y-6 w-full">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold tracking-tight">Payloads</h1>
    <button 
      class="btn btn-sm preset-filled-primary-500 flex items-center gap-2"
      onclick={() => navigate('/payloads/new')}
    >
      <Plus size={16} />
      New
    </button>
  </div>

  <!-- Content -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Loading payloads...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading payloads:</span> {errorMessage}
    </div>
  {:else if payloads.length === 0}
    <div class="card p-8 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-center">
      <p class="text-surface-500 text-sm">No payloads configured.</p>
      <div class="flex justify-center mt-3">
        <button class="btn btn-sm preset-tonal-surface-500 btn-sm" onclick={() => navigate('/payloads/new')}>
          Create New
        </button>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each payloads as payload (payload.id)}
        <div class="card p-5 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm flex flex-col justify-between">
          <div class="space-y-3 flex-grow">
            <div class="flex justify-between items-start gap-4">
              <h2 class="text-base font-bold truncate text-surface-900 dark:text-white" title={payload.name}>
                {payload.name}
              </h2>
              <span class="badge preset-filled-warning-500 text-[10px] px-1.5 py-0.5 font-semibold">
                {payload.type}
              </span>
            </div>
            {#if payload.description}
              <p class="text-xs text-surface-500 dark:text-surface-400 line-clamp-3">
                {payload.description}
              </p>
            {/if}
          </div>
          
          <hr class="my-4 border-surface-200 dark:border-surface-800" />
          
          <div class="flex justify-end items-center gap-2">
            {#if payload.attachmentName}
              <button 
                class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1"
                onclick={() => handleExport(payload.id, payload.attachmentName)}
              >
                <Download size={12} />
                Export
              </button>
            {/if}
            <button 
              class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1"
              onclick={() => navigate(`/payloads/${payload.id}/edit`)}
            >
              <Edit size={12} />
              Edit
            </button>
            <button 
              class="btn btn-sm preset-filled-error-500 flex items-center gap-1"
              disabled={$deleteMutation.isPending && $deleteMutation.variables === payload.id}
              onclick={() => handleDelete(payload.id)}
            >
              <Trash size={12} />
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
