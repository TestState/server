<script>
  import Download from '@lucide/svelte/icons/download';

  let { attachments, sessionId } = $props();

  const getAttachmentDownloadUrl = (index) => {
    return `/api/tests/sessions/${sessionId}/attachments/${index}`;
  };
</script>

{#if attachments.length > 0}
  <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
    <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Assets</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {#each attachments as attachment, idx (attachment.name)}
        <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-850 rounded-lg p-4 text-center flex flex-col justify-between items-center gap-2">
          <div class="w-full text-center">
            <h3 class="font-semibold text-sm truncate text-surface-850 dark:text-gray-250" title={attachment.name}>
              {attachment.name}
            </h3>
            <p class="text-xs text-surface-400 mt-0.5">
              {attachment.mimeType}
            </p>
          </div>
          
          {#if attachment.mimeType?.startsWith('image/')}
            <div class="w-full h-28 bg-black flex items-center justify-center rounded overflow-hidden mt-1">
              <img
                src={getAttachmentDownloadUrl(idx)}
                alt={attachment.name}
                class="max-h-full max-w-full object-contain"
              />
            </div>
          {/if}

          <a
            href={getAttachmentDownloadUrl(idx)}
            download={attachment.name}
            class="btn btn-sm w-full mt-2 preset-tonal-surface-500 flex items-center justify-center gap-1"
          >
            <Download size={12} />
            <span>Download</span>
          </a>
        </div>
      {/each}
    </div>
  </div>
{/if}
