<script setup>
import { computed, watch, onUnmounted } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { getCleanStatus, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';

const props = defineProps({
  batchId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const batchQuery = useQuery({
  queryKey: ['batch', props.batchId],
  queryFn: () => safeFetch(`/api/tests/batches/${props.batchId}`)
});

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

const batch = computed(() => batchQuery.data.value);
const isLoading = computed(() => batchQuery.isPending.value);
const hasError = computed(() => batchQuery.error.value);
const errorMessage = computed(() => batchQuery.error.value?.message || String(batchQuery.error.value));

const cancelling = computed(() => cancelMutation.isPending.value);
const isCancelable = computed(() => batch.value && (batch.value.status === 'PENDING' || batch.value.status === 'RUNNING'));

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
const total = computed(() => batch.value?.iterations || 0);
const passed = computed(() => batch.value?.passedCount !== undefined ? batch.value.passedCount : sessions.value.filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length);
const failed = computed(() => batch.value?.failedCount !== undefined ? batch.value.failedCount : sessions.value.filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length);
const running = computed(() => batch.value?.runningCount !== undefined ? batch.value.runningCount : sessions.value.filter(s => s.status?.includes('RUNNING')).length);
const pending = computed(() => batch.value?.pendingCount !== undefined ? batch.value.pendingCount : Math.max(0, total.value - (passed.value + failed.value) - running.value));

const rate = computed(() => {
  const r = batch.value?.throughput;
  return typeof r === 'number' ? r.toFixed(2) : r || '0.00';
});
const time = computed(() => {
  const t = batch.value?.averageNegotiationDuration;
  return typeof t === 'number' ? t.toFixed(2) : t || '0.00';
});

const handleCancel = () => {
  if (window.confirm('Are you sure you want to stop this batch run?')) {
    cancelMutation.mutate();
  }
};

const mapColor = (status) => {
  const col = getStatusColor(status);
  if (col === 'danger') return 'error';
  if (col === 'secondary') return 'neutral';
  return col;
};
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
          <UIcon name="i-lucide-download" class="w-3.5 h-3.5" />
          <span>Export</span>
        </a>
        <a
          :href="`/api/tests/batches/${batchId}/report?full=true`"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <UIcon name="i-lucide-code" class="w-3.5 h-3.5" />
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
      <UIcon name="i-lucide-loader-2" class="animate-spin w-10 h-10 text-primary-500" />
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
      <!-- Progress Card -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Progress
          </h2>
        </template>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-gray-400">Status</span>
            <div class="flex justify-center mt-1">
              <UBadge
                :color="mapColor(batch.status)"
                variant="subtle"
                size="sm"
              >
                {{ getCleanStatus(batch.status) }}
              </UBadge>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-gray-400">Total</span>
            <span class="font-bold text-md block mt-1 text-gray-800 dark:text-gray-100">{{ total }}</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-green-500">Passed</span>
            <span class="font-bold text-md block mt-1 text-green-600 dark:text-green-400">{{ passed }}</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-red-500">Failed</span>
            <span class="font-bold text-md block mt-1 text-red-600 dark:text-red-400">{{ failed }}</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-yellow-500">Running</span>
            <span class="font-bold text-md block mt-1 text-yellow-600 dark:text-yellow-400">{{ running }}</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-gray-400">Pending</span>
            <span class="font-bold text-md block mt-1 text-gray-800 dark:text-gray-100">{{ pending }}</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-gray-400">Rate</span>
            <span class="font-bold text-md block mt-1 text-gray-800 dark:text-gray-100">{{ rate }}/m</span>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg text-center shadow-sm">
            <span class="text-xs uppercase font-bold text-gray-400">Time</span>
            <span class="font-bold text-md block mt-1 text-gray-800 dark:text-gray-100">{{ time }}ms</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          v-if="total > 0"
          class="w-full h-3.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex mt-4 border border-gray-300 dark:border-gray-700 shadow-inner"
        >
          <div
            v-if="passed > 0"
            :style="{ width: `${(passed / total) * 100}%` }"
            class="bg-green-500 h-full"
            :title="`Passed: ${passed}`"
          />
          <div
            v-if="failed > 0"
            :style="{ width: `${(failed / total) * 100}%` }"
            class="bg-red-500 h-full"
            :title="`Failed: ${failed}`"
          />
          <div
            v-if="running > 0"
            :style="{ width: `${(running / total) * 100}%` }"
            class="bg-yellow-500 h-full"
            :title="`Running: ${running}`"
          />
          <div
            v-if="pending > 0"
            :style="{ width: `${(pending / total) * 100}%` }"
            class="bg-gray-400 h-full"
            :title="`Pending: ${pending}`"
          />
        </div>
      </UCard>

      <!-- Sessions Grid -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Sessions
          </h2>
        </template>
        
        <p
          v-if="sessions.length === 0"
          class="text-center text-sm text-gray-500 py-4"
        >
          No sessions active for this batch.
        </p>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div 
            v-for="sess in sessions" 
            :key="sess.sessionId"
            class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between min-h-[140px]"
          >
            <div class="space-y-2 flex-grow">
              <div class="flex justify-between items-start gap-4">
                <h3
                  class="font-semibold text-sm truncate text-gray-800 dark:text-gray-200"
                  :title="sess.agentName"
                >
                  {{ sess.agentName }}
                </h3>
                <span
                  class="font-mono text-xs text-gray-400 shrink-0"
                  :title="sess.sessionId"
                >
                  {{ sess.sessionId.slice(0, 8) }}...
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  :color="mapColor(sess.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ getCleanStatus(sess.status) }}
                </UBadge>
                <span
                  v-if="sess.negotiationDurationMs > 0"
                  class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  {{ sess.negotiationDurationMs }}ms
                </span>
              </div>
              <p
                v-if="sess.message"
                class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2"
                :title="sess.message"
              >
                {{ sess.message }}
              </p>
            </div>
            
            <USeparator class="my-2" />
            
            <div class="flex justify-end">
              <UButton 
                label="View" 
                variant="link" 
                size="sm" 
                class="p-0 font-semibold"
                @click="router.push(`/tests/session/${sess.sessionId}/status`)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
