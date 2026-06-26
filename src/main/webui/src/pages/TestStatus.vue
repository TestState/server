<script>
// Define component name for recursive template resolution
export default {
  name: 'TestStatus'
}
</script>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { getCleanStatus, getDisplayDuration, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const telemetryLogs = ref([]);
const logsContainerRef = ref(null);
const expandedSteps = ref({});

const toggleStep = (stepName) => {
  expandedSteps.value[stepName] = !expandedSteps.value[stepName];
};

const sessionQuery = useQuery({
  queryKey: ['testSession', props.sessionId],
  queryFn: () => safeFetch(`/api/tests/sessions/${props.sessionId}`)
});

const session = computed(() => sessionQuery.data.value);
const isLoading = computed(() => sessionQuery.isPending.value);
const hasError = computed(() => sessionQuery.error.value);
const errorMessage = computed(() => sessionQuery.error.value?.message || String(sessionQuery.error.value));

let ws = null;
let isConnectingOrConnected = false;

const connectWebSocket = (sess) => {
  if (sess.terminal && !isConnectingOrConnected) {
    telemetryLogs.value = sess.logs || [];
    return;
  }

  if (!sess.terminal && !isConnectingOrConnected) {
    isConnectingOrConnected = true;

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
          nextTick(() => {
            if (logsContainerRef.value) {
              logsContainerRef.value.scrollTop = logsContainerRef.value.scrollHeight;
            }
          });
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

const getAttachmentDownloadUrl = (index) => {
  return `/api/tests/sessions/${props.sessionId}/attachments/${index}`;
};

const hasResult = computed(() => !!session.value?.result);
const resultData = computed(() => session.value?.result);
const reports = computed(() => resultData.value?.reports || []);
const attachments = computed(() => resultData.value?.attachments || []);
const summary = computed(() => resultData.value?.summary);

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
          <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
          <span>Export</span>
        </a>
        <a
          :href="`/api/tests/sessions/${sessionId}/report?full=true`"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <UIcon name="i-lucide-code" class="w-3.5 h-3.5" />
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
      <UIcon name="i-lucide-loader-2" class="animate-spin w-10 h-10 text-primary-500" />
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
      <!-- Progress Section -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex justify-between items-center w-full">
            <h2 class="text-base font-semibold">
              Progress
            </h2>
            <UBadge
              :color="mapColor(session.status)"
              variant="subtle"
              size="sm"
            >
              {{ getCleanStatus(session.status) }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-gray-400">Agent Name</span>
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ session.agentName || 'N/A' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-gray-400">Agent ID</span>
            <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ session.agentId || 'N/A' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-gray-400">Negotiation Time</span>
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ session.negotiationDurationMs ? `${session.negotiationDurationMs} ms` : 'N/A' }}</span>
          </div>
        </div>

        <UAlert
          v-if="session.statusMessage"
          :description="session.statusMessage"
          color="info"
          variant="subtle"
          class="w-full mt-4"
        />

        <!-- Execution Steps -->
        <div
          v-if="reports.length > 0"
          class="space-y-2 pt-4"
        >
          <h3 class="font-semibold text-sm">
            Execution Steps
          </h3>
          <div class="space-y-2">
            <div 
              v-for="step in reports" 
              :key="step.name"
              class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50"
            >
              <div 
                class="flex justify-between items-center p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                @click="toggleStep(step.name)"
              >
                <div class="flex items-center gap-2">
                  <UBadge
                    :color="mapColor(step.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ getCleanStatus(step.status || 'PENDING') }}
                  </UBadge>
                  <span class="font-bold text-sm text-gray-700 dark:text-gray-200">{{ step.name || 'Unnamed Step' }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-gray-400">{{ getDisplayDuration(step.summary?.totalDuration ?? 0) }}</span>
                  <UIcon
                    :name="expandedSteps[step.name] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="text-gray-400 w-4 h-4"
                  />
                </div>
              </div>

              <div
                v-if="expandedSteps[step.name]"
                class="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 space-y-3"
              >
                <pre 
                  v-if="step.summary?.metadata && Object.keys(step.summary.metadata).length > 0"
                  class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono"
                >{{ JSON.stringify(step.summary.metadata, null, 2) }}</pre>

                <!-- Substeps recursion -->
                <div
                  v-if="step.steps && step.steps.length > 0"
                  class="pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-2"
                >
                  <div 
                    v-for="subStep in step.steps" 
                    :key="subStep.name"
                    class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div 
                      class="flex justify-between items-center p-2.5 cursor-pointer select-none"
                      @click="toggleStep(subStep.name)"
                    >
                      <div class="flex items-center gap-2">
                        <UBadge
                          :color="mapColor(subStep.status)"
                          variant="subtle"
                          size="sm"
                        >
                          {{ getCleanStatus(subStep.status || 'PENDING') }}
                        </UBadge>
                        <span class="font-semibold text-xs text-gray-700 dark:text-gray-200">{{ subStep.name || 'Unnamed Substep' }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs text-gray-400">{{ getDisplayDuration(subStep.summary?.totalDuration ?? 0) }}</span>
                        <UIcon
                          :name="expandedSteps[subStep.name] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                          class="text-gray-400 w-3.5 h-3.5"
                        />
                      </div>
                    </div>
                    <div
                      v-if="expandedSteps[subStep.name]"
                      class="p-3 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
                    >
                      <pre 
                        v-if="subStep.summary?.metadata && Object.keys(subStep.summary.metadata).length > 0"
                        class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono"
                      >{{ JSON.stringify(subStep.summary.metadata, null, 2) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

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

      <!-- Assets Section -->
      <UCard
        v-if="hasResult && attachments.length > 0"
        class="shadow-sm"
      >
        <template #header>
          <h2 class="text-base font-semibold">
            Assets
          </h2>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div 
            v-for="(attachment, idx) in attachments" 
            :key="attachment.name"
            class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center flex flex-col justify-between items-center gap-2"
          >
            <div class="w-full text-center">
              <h3
                class="font-semibold text-sm truncate text-gray-800 dark:text-gray-200"
                :title="attachment.name"
              >
                {{ attachment.name }}
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ attachment.mimeType }}
              </p>
            </div>
            <div
              v-if="attachment.mimeType?.startsWith('image/')"
              class="w-full h-28 bg-black flex items-center justify-center rounded overflow-hidden mt-1"
            >
              <img
                :src="getAttachmentDownloadUrl(idx)"
                :alt="attachment.name"
                class="max-h-full max-w-full object-contain"
              >
            </div>
            <a
              :href="getAttachmentDownloadUrl(idx)"
              :download="attachment.name"
              class="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full mt-2"
            >
              <UIcon name="i-lucide-download" class="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </UCard>

      <!-- Logs Section -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Logs
          </h2>
        </template>
        <div
          ref="logsContainerRef"
          class="bg-black p-4 rounded-lg border border-gray-800 max-h-[250px] overflow-y-auto font-mono text-xs"
        >
          <div
            v-if="telemetryLogs.length === 0"
            class="text-gray-600 italic"
          >
            Awaiting telemetry logs...
          </div>
          <div v-else>
            <div 
              v-for="log in telemetryLogs" 
              :key="log.timestamp + log.message"
              class="mb-1"
              :class="[
                log.level === 'ERROR' ? 'text-red-400' :
                log.level === 'WARNING' ? 'text-yellow-400' :
                'text-green-400'
              ]"
            >
              [{{ new Date(log.timestamp).toLocaleTimeString() }}] [{{ log.level }}] {{ log.message }}
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
