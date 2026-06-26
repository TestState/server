<script setup>
import { computed, defineAsyncComponent, ref, watch, onUnmounted } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useTestSessionQuery } from '@/composables/useTestSessionQuery';
import { getDisplayDuration } from '@/utils/format';
import { useRouter } from 'vue-router';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const sessionQuery = useTestSessionQuery(props.sessionId);

const session = computed(() => sessionQuery.data.value);
const isLoading = computed(() => sessionQuery.isPending.value);
const hasError = computed(() => sessionQuery.error.value);
const errorMessage = computed(() => sessionQuery.error.value?.message || String(sessionQuery.error.value));

const hasResult = computed(() => !!session.value?.result);
const resultData = computed(() => session.value?.result);
const reports = computed(() => resultData.value?.reports || []);
const attachments = computed(() => resultData.value?.attachments || []);
const summary = computed(() => resultData.value?.summary);

const telemetryLogs = ref([]);
let ws = null;
let isConnectingOrConnected = false;

const connectWebSocket = (sess) => {
  if (sess.terminal && !isConnectingOrConnected) {
    telemetryLogs.value = sess.logs || [];
    return;
  }

  if (!sess.terminal && !isConnectingOrConnected) {
    isConnectingOrConnected = true;
    telemetryLogs.value = sess.logs || [];

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/telemetry/test/${props.sessionId}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATUS') {
          queryClient.setQueryData(['testSession', props.sessionId], prev =>
            prev ? { ...prev, status: msg.state, statusMessage: msg.message } : null
          );
        } else if (msg.type === 'RESULT') {
          queryClient.setQueryData(['testSession', props.sessionId], prev =>
            prev ? { ...prev, result: msg.result } : null
          );
          queryClient.invalidateQueries({ queryKey: ['testSession', props.sessionId] });
        } else if (msg.type === 'TELEMETRY') {
          telemetryLogs.value.push(msg);
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
  }
};

watch(session, (newVal) => {
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

const SessionProgress = defineAsyncComponent(() => import('@/components/SessionProgress.vue'));
const ExecutionSteps = defineAsyncComponent(() => import('@/components/ExecutionSteps.vue'));
const SessionAssets = defineAsyncComponent(() => import('@/components/SessionAssets.vue'));
const SessionLogs = defineAsyncComponent(() => import('@/components/SessionLogs.vue'));
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="space-y-0.5">
        <h1 class="text-2xl font-bold tracking-tight">
          Test Session
        </h1>
        <p class="font-mono text-xs text-gray-400">
          {{ sessionId }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          :href="`/api/tests/sessions/${sessionId}/report`"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <UIcon
            name="i-lucide-external-link"
            class="w-3.5 h-3.5"
          />
          <span>Export</span>
        </a>
        <a
          :href="`/api/tests/sessions/${sessionId}/report?full=true`"
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
      title="Error loading test session"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Not Found State -->
    <UCard
      v-else-if="!session"
      class="text-center py-8 shadow-sm"
    >
      <p class="text-gray-500 text-sm">
        Session not found.
      </p>
      <div class="flex justify-center mt-3">
        <UButton
          label="Back to Tests"
          size="sm"
          @click="router.push('/tests')"
        />
      </div>
    </UCard>

    <div
      v-else
      class="space-y-6"
    >
      <!-- Progress Section Island -->
      <SessionProgress :session="session" />

      <!-- Summary Section -->
      <UCard
        v-if="hasResult && summary"
        class="shadow-sm"
      >
        <template #header>
          <h2 class="text-base font-semibold">
            Summary
          </h2>
        </template>
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">Duration:</span>
            <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ getDisplayDuration(summary.totalDuration) }}</span>
          </div>
          <pre 
            v-if="summary.metadata && Object.keys(summary.metadata).length > 0"
            class="bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono"
          >{{ JSON.stringify(summary.metadata, null, 2) }}</pre>
        </div>
      </UCard>

      <!-- Execution Steps Island -->
      <ExecutionSteps :reports="reports" />

      <!-- Assets Island -->
      <SessionAssets
        :attachments="attachments"
        :session-id="sessionId"
      />

      <!-- Logs Island -->
      <SessionLogs :logs="telemetryLogs" />
    </div>
  </div>
</template>
