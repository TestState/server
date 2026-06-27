<script>
  import { onDestroy } from 'svelte';
  import { useTestSessionQuery } from '@/composables/queries.svelte';
  import { getDisplayDuration } from '@/utils/format';
  import { navigate, route } from '@/router.js';
  import ExternalLink from '@lucide/svelte/icons/external-link';
import Code from '@lucide/svelte/icons/code';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import Loader2 from '@lucide/svelte/icons/loader-2';

  import SessionProgress from '@/components/SessionProgress.svelte';
  import ExecutionSteps from '@/components/ExecutionSteps.svelte';
  import SessionAssets from '@/components/SessionAssets.svelte';
  import SessionLogs from '@/components/SessionLogs.svelte';

  let sessionId = $derived(route.params.sessionId);

  const sessionQuery = useTestSessionQuery(() => sessionId);

  let session = $derived(sessionQuery.data);
  let isLoading = $derived(sessionQuery.isPending);
  let hasError = $derived(sessionQuery.isError);
  let errorMessage = $derived(sessionQuery.error?.message || String(sessionQuery.error));

  let hasResult = $derived(!!session?.result);
  let resultData = $derived(session?.result);
  let reports = $derived(resultData?.reports || []);
  let attachments = $derived(resultData?.attachments || []);
  let summary = $derived(resultData?.summary);

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
      ws = new WebSocket(`${protocol}//${host}/telemetry/test/${sessionId}`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATUS') {
            const prev = sessionQuery.data;
            if (prev) {
              sessionQuery.data = { ...prev, status: msg.state, statusMessage: msg.message };
            }
          } else if (msg.type === 'RESULT') {
            const prev = sessionQuery.data;
            if (prev) {
              sessionQuery.data = { ...prev, result: msg.result };
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

  $effect(() => {
    if (session) {
      connectWebSocket(session);
    }
  });

  const cleanupWS = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnectingOrConnected = false;
    telemetryLogs = [];
  };

  $effect(() => {
    // React to sessionId changes
    if (sessionId) {
      cleanupWS();
    }
  });

  onDestroy(() => {
    cleanupWS();
  });
</script>

<div class="space-y-6 w-full">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="space-y-0.5">
      <h1 class="text-2xl font-bold tracking-tight">Test Session</h1>
      <p class="font-mono text-xs text-surface-400">{sessionId}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href="/api/tests/sessions/{sessionId}/report"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1.5"
      >
        <ExternalLink size={14} />
        <span>Export</span>
      </a>
      <a
        href="/api/tests/sessions/{sessionId}/report?full=true"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-1.5"
      >
        <Code size={14} />
        <span>JSON</span>
      </a>
      <button 
        onclick={() => navigate('/tests')}
        class="btn btn-sm preset-tonal-surface-500 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Return
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
      <Loader2 class="animate-spin w-8 h-8 text-primary-500" />
      <p class="text-sm text-surface-500">Waiting...</p>
    </div>
  {:else if hasError}
    <div class="alert preset-tonal-error p-4 rounded-lg">
      <span class="font-medium">Error loading test session:</span> {errorMessage}
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Progress Section Island -->
      <SessionProgress {session} />

      <!-- Summary Section -->
      {#if hasResult && summary}
        <div class="card p-6 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm">
          <h2 class="text-base font-semibold text-surface-900 dark:text-white mb-4">Summary</h2>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-surface-500">Duration:</span>
              <span class="font-mono font-semibold text-surface-900 dark:text-white">{getDisplayDuration(summary.totalDuration)}</span>
            </div>
            {#if summary.metadata && Object.keys(summary.metadata).length > 0}
              <pre class="bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">{JSON.stringify(summary.metadata, null, 2)}</pre>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Execution Steps Island -->
      <ExecutionSteps {reports} />

      <!-- Assets Island -->
      <SessionAssets {attachments} {sessionId} />

      <!-- Logs Island -->
      <SessionLogs logs={telemetryLogs} />
    </div>
  {/if}
</div>
