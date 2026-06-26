<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { getCleanStatus, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';
import SavePayloadForm from './SavePayloadForm.vue';

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

const sessionQuery = useQuery({
  queryKey: ['translationSession', props.sessionId],
  queryFn: () => safeFetch(`/api/translations/sessions/${props.sessionId}`)
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
    ws = new WebSocket(`${protocol}//${host}/telemetry/translation/${props.sessionId}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATUS') {
          queryClient.setQueryData(['translationSession', props.sessionId], (prev) => {
            return prev ? { ...prev, status: msg.state, statusMessage: msg.message } : null;
          });
        } else if (msg.type === 'RESULT') {
          const items = msg.result.map(item => ({
            index: item.index,
            name: item.name,
            type: item.type,
            databaseId: null
          }));
          queryClient.setQueryData(['translationSession', props.sessionId], (prev) => {
            return prev ? { ...prev, generatedItems: items } : null;
          });
          queryClient.invalidateQueries({ queryKey: ['translationSession', props.sessionId] });
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

const handleSaveSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['translationSession', props.sessionId] });
};

const hasResult = computed(() => session.value?.generatedItems && session.value.generatedItems.length > 0);

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
    <div class="flex justify-between items-center">
      <div class="space-y-0.5">
        <h1 class="text-2xl font-bold tracking-tight">
          Translation Status
        </h1>
        <p class="font-mono text-xs text-gray-400">
          {{ sessionId }}
        </p>
      </div>
      <UButton 
        label="Return" 
        color="neutral" 
        variant="outline" 
        size="sm" 
        icon="i-lucide-arrow-left"
        @click="router.push('/translations')"
      />
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
      title="Error loading translation status"
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
          label="Back to Translations"
          size="sm"
          @click="router.push('/translations')"
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
        
        <div class="space-y-1">
          <span class="text-xs text-gray-400 block">Status Message</span>
          <p class="font-semibold text-sm text-gray-800 dark:text-gray-200">
            {{ session.statusMessage || 'Awaiting agent translation...' }}
          </p>
        </div>
      </UCard>

      <!-- Result Section -->
      <UCard
        v-if="hasResult"
        class="shadow-sm"
      >
        <template #header>
          <h2 class="text-base font-semibold">
            Result
          </h2>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div 
            v-for="item in session.generatedItems" 
            :key="item.index"
            class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col justify-between"
          >
            <div class="flex justify-between items-start gap-4 mb-3">
              <div class="min-w-0 flex-1">
                <h3
                  class="font-semibold text-sm truncate text-gray-800 dark:text-gray-200"
                  :title="item.name || item.type"
                >
                  {{ item.name || item.type }}
                </h3>
                <p class="font-mono text-xs text-gray-400 mt-0.5">
                  {{ item.type }}
                </p>
              </div>
              <a
                :href="`/api/translations/sessions/${sessionId}/payloads/${item.index}/download`"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors shrink-0"
                download
              >
                <UIcon name="i-lucide-download" class="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>

            <div
              v-if="item.databaseId"
              class="inline-flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 text-xs font-semibold mt-2"
            >
              <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
              <span>Saved in Database (ID: {{ item.databaseId }})</span>
            </div>

            <SavePayloadForm
              v-else
              :session-id="sessionId"
              :item="item"
              @save-success="handleSaveSuccess"
            />
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
