<script>
  import { createMutation } from '@tanstack/svelte-query';
  import { safeFetch } from '@/utils/safeFetch';
  import Save from '@lucide/svelte/icons/save';
import Loader2 from '@lucide/svelte/icons/loader-2';

  let { sessionId, item, onSaveSuccess } = $props();

  let name = $state('');
  let description = $state('');

  $effect(() => {
    name = `Translated: ${item.name || item.type}`;
    description = `Translated ${item.type} from session ${sessionId}`;
  });

  const mutation = createMutation({
    mutationFn: (body) => safeFetch(`/api/translations/sessions/${sessionId}/payloads/${item.index}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    onSuccess: () => {
      if (onSaveSuccess) onSaveSuccess();
    },
    onError: (err) => {
      alert('Failed to save payload: ' + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    $mutation.mutate({
      name,
      description
    });
  };
</script>

<form class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800 space-y-3" onsubmit={handleSubmit}>
  <span class="text-xs text-surface-500 dark:text-surface-400 block font-semibold">Save as database payload:</span>
  <div class="w-full">
    <input
      type="text"
      bind:value={name}
      placeholder="Name"
      required
      class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full text-sm"
    />
  </div>
  <div class="w-full">
    <input
      type="text"
      bind:value={description}
      placeholder="Description"
      class="input p-2 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-850 w-full text-sm"
    />
  </div>
  <div class="flex justify-end">
    <button
      type="submit"
      class="btn btn-sm preset-filled-primary-500 flex items-center gap-1"
      disabled={$mutation.isPending}
    >
      {#if $mutation.isPending}
        <Loader2 class="animate-spin" size={12} />
      {:else}
        <Save size={12} />
      {/if}
      Save
    </button>
  </div>
</form>
