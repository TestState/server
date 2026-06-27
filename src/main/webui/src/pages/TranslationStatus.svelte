<script>
  import { onDestroy } from 'svelte';
  import { useTranslationSessionQuery } from '@/composables/queries.svelte';
  import { getCleanStatus, getStatusColor } from '@/utils/format';
  import { navigate, route } from '@/router.js';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Download from '@lucide/svelte/icons/download';
import Check from '@lucide/svelte/icons/check';
import Loader2 from '@lucide/svelte/icons/loader-2';

  import SavePayloadForm from '@/pages/SavePayloadForm.svelte';
  import SessionLogs from '@/components/SessionLogs.svelte';

  let sessionId = $derived(route.params.sessionId);

  const sessionQuery = useTranslationSessionQuery(() => sessionId);

  let session = $derived(sessionQuery?.data);
  let isLoading = $derived(sessionQuery?.isPending);
  let hasError = $derived(sessionQuery?.isError);
  let errorMessage = $derived(sessionQuery?.error?.message || String(sessionQuery?.error));

  const handleSaveSuccess = () => {
    sessionQuery.refetch();
  };

  let telemetryLogs = $state([]);
  let ws = null;
  let isConnectingOrConnected = false;

  const connectWebSocket = (sess) => {
    if (sess.terminal && !isConnectingOrConnected) {
      telemetryLogs = sess.logs ? [...sess.logs] : [];
      return;
    }

    if (!sess.terminal && !isConnectingOrConnected) {
      isConnectingOrConnected = true;
      telemetryLogs = [];

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/telemetry/translation/${sessionId}`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATUS') {
            const prev = sessionQuery.data;
            if (prev) {
              sessionQuery.data = { ...prev, status: msg.state, statusMessage: msg.message };
            }
          } else if (msg.type === 'RESULT') {
            const items = msg.result.map(item => ({
              index: item.index,
              name: item.name,
              type: item.type,
              databaseId: null
            }));
            const prev = sessionQuery.data;
            if (prev) {
              sessionQuery.data = { ...prev, generatedItems: items };
            }
            sessionQuery.refetch();
          } else if (msg.type === 'TELEMETRY') {
            telemetryLogs = [...telemetryLogs, msg];
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket encountered error", err);
      };
    }

    if (sess.terminal && ws) {
      ws.close();
      ws = null;
      isConnectingOrConnected = false;
    }
  };

  const cleanupWS = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnectingOrConnected = false;
    telemetryLogs = [];
  };

  $effect(() => {
    if (sessionId) {
      cleanupWS();
    }
  });

  $effect(() => {
    if (session) {
      connectWebSocket(session);
    }
  });

  onDestroy(() => {
    cleanupWS();
  });

  let hasResult = $derived(session?.generatedItems && session.generatedItems.length > 0);

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

<div class="space-y-6 w-full">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div class="space-y-0.5">
      <h1 class="text-2xl font-bold tracking-tight">Translation Status</h1>
      <p class="font-mono text-xs text-surface-400">{sessionId}</p>
    </div>
    <button 
      onclick={() => navigate('/translations')}
      class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
    >
      <ArrowLeft size={16} />
      Return
    </button>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Waiting...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading translation status:</span> {errorMessage}
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Progress Section Inline -->
      <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
        <div class="flex justify-between items-center w-full mb-4">
          <h2 class="text-base font-semibold text-surface-900 dark:text-white">Progress</h2>
          <span class="badge {getBadgePreset(session.status)} text-[10px] px-1.5 py-0.5 font-semibold">
            {getCleanStatus(session.status)}
          </span>
        </div>
        
        <div class="space-y-1">
          <span class="text-xs text-surface-500 block">Status Message</span>
          <p class="font-semibold text-sm text-surface-950 dark:text-white">
            {session.statusMessage || 'Awaiting agent translation...'}
          </p>
        </div>
      </div>

      <!-- Result Section Inline -->
      {#if hasResult}
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Result</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {#each session.generatedItems as item (item.index)}
              <div class="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-4 flex flex-col justify-between">
                <div class="flex justify-between items-start gap-4 mb-3">
                  <div class="min-w-0 flex-1">
                    <h3 class="font-semibold text-sm truncate text-surface-950 dark:text-white" title={item.name || item.type}>
                      {item.name || item.type}
                    </h3>
                    <p class="font-mono text-xs text-surface-400 mt-0.5">
                      {item.type}
                    </p>
                  </div>
                  <a
                    href="/api/translations/sessions/{session.sessionId}/payloads/{item.index}/download"
                    class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1 shrink-0"
                    download
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>

                {#if item.databaseId}
                  <div class="inline-flex items-center gap-2 p-2 rounded bg-success-500/10 text-success-500 border border-success-500/20 text-xs font-semibold mt-2">
                    <Check size={14} />
                    <span>Saved in Database (ID: {item.databaseId})</span>
                  </div>
                {:else}
                  <SavePayloadForm
                    sessionId={session.sessionId}
                    {item}
                    onSaveSuccess={handleSaveSuccess}
                  />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Logs Section (Reused SessionLogs) -->
      <SessionLogs logs={telemetryLogs} />
    </div>
  {/if}
</div>
