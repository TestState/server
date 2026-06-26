<script setup>
import { computed, defineAsyncComponent, watch, onUnmounted } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useBatchQuery } from '@/composables/useBatchQuery';
import { safeFetch } from '@/utils/safeFetch';
import { useRouter } from 'vue-router';

const props = defineProps({
  batchId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const batchQuery = useBatchQuery(props.batchId);

const cancelMutation = useMutation({
  mutationFn: () => safeFetch(`/api/tests/batches/${props.batchId}/cancel`, { method: 'POST' }),
  onSuccess: () => {
    alert('Batch execution stop request sent');
    queryClient.invalidateQueries({ queryKey: ['batch', props.batchId] });
  },
  onError: (err) => {
    alert('Failed to cancel batch: ' + err.message);
  }
});

const batch = computed(() => batchQuery.data.value);
const isLoading = computed(() => batchQuery.isPending.value);
const hasError = computed(() => batchQuery.error.value);
const errorMessage = computed(() => batchQuery.error.value?.message || String(batchQuery.error.value));

const cancelling = computed(() => cancelMutation.isPending.value);
const isCancelable = computed(() => batch.value && (batch.value.status === 'PENDING' || batch.value.status === 'RUNNING'));

let ws = null;
let isConnectingOrConnected = false;

const connectWebSocket = (b) => {
  if (b.terminal && !isConnectingOrConnected) {
    return;
  }

  if (!b.terminal && !isConnectingOrConnected) {
    isConnectingOrConnected = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/telemetry/test/batch/${props.batchId}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'BATCH_UPDATE') {
          queryClient.setQueryData(['batch', props.batchId], {
            batchId: msg.batchId,
            status: msg.status,
            completed: msg.completed,
            iterations: msg.totalIterations,
            passedCount: msg.passedCount,
            failedCount: msg.failedCount,
            runningCount: msg.runningCount,
            pendingCount: msg.pendingCount,
            throughput: parseFloat(msg.throughput) || 0,
            averageNegotiationDuration: parseFloat(msg.avgNegotiate) || 0,
            sessions: msg.sessions?.map(s => ({
              id: s.sessionId,
              sessionId: s.sessionId,
              status: s.state,
              message: s.message,
              agentId: s.agentId,
              agentName: s.agentName,
              negotiationDurationMs: s.negotiationDurationMs,
              terminal: s.terminal
            })) || []
          });

          if (msg.terminal) {
            queryClient.invalidateQueries({ queryKey: ['batch', props.batchId] });
          }
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket encountered error", err);
    };
  }

  if (b.terminal && ws) {
    ws.close();
    ws = null;
  }
};

const handleCancel = () => {
  if (window.confirm('Are you sure you want to stop this batch run?')) {
    cancelMutation.mutate();
  }
};

watch(batch, (newVal) => {
  if (newVal) {
    connectWebSocket(newVal);
  }
}, { immediate: true });

onUnmounted(() => {
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnectingOrConnected = false;
});

const sessions = computed(() => batch.value?.sessions || []);

const BatchProgress = defineAsyncComponent(() => import('@/components/BatchProgress.vue'));
const BatchSessionsGrid = defineAsyncComponent(() => import('@/components/BatchSessionsGrid.vue'));
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="space-y-0.5">
        <h1 class="text-2xl font-bold tracking-tight">
          Batch Status
        </h1>
        <p class="font-mono text-xs text-gray-400">
          {{ batchId }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          :href="`/api/tests/batches/${batchId}/report`"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <UIcon
            name="i-lucide-download"
            class="w-3.5 h-3.5"
          />
          <span>Export</span>
        </a>
        <a
          :href="`/api/tests/batches/${batchId}/report?full=true`"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <UIcon
            name="i-lucide-code"
            class="w-3.5 h-3.5"
          />
          <span>JSON</span>
        </a>
        <UButton
          v-if="isCancelable"
          label="Stop"
          color="error"
          size="sm"
          icon="i-lucide-x-circle"
          :loading="cancelling"
          @click="handleCancel"
        />
        <UButton 
          label="Return" 
          color="neutral" 
          variant="outline" 
          size="sm" 
          icon="i-lucide-arrow-left"
          @click="router.push('/tests')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[30vh] gap-3"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-10 h-10 text-primary-500"
      />
      <p class="text-sm text-gray-500">
        Waiting...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading batch status"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <div
      v-else-if="batch"
      class="space-y-6"
    >
      <!-- Progress Island -->
      <BatchProgress :batch="batch" />

      <!-- Sessions Island -->
      <BatchSessionsGrid :sessions="sessions" />
    </div>
  </div>
</template>
