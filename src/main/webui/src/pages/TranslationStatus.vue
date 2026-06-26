<script setup>
import { computed, defineAsyncComponent, ref, watch, onUnmounted } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useTranslationSessionQuery } from '@/composables/useTranslationSessionQuery';
import { useRouter } from 'vue-router';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const sessionQuery = useTranslationSessionQuery(props.sessionId);

const session = computed(() => sessionQuery.data.value);
const isLoading = computed(() => sessionQuery.isPending.value);
const hasError = computed(() => sessionQuery.error.value);
const errorMessage = computed(() => sessionQuery.error.value?.message || String(sessionQuery.error.value));

const handleSaveSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['translationSession', props.sessionId] });
};

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

const TranslationProgress = defineAsyncComponent(() => import('@/components/TranslationProgress.vue'));
const TranslationResultsGrid = defineAsyncComponent(() => import('@/components/TranslationResultsGrid.vue'));
const TranslationLogs = defineAsyncComponent(() => import('@/components/TranslationLogs.vue'));
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
      <!-- Progress Island -->
      <TranslationProgress :session="session" />

      <!-- Result Island -->
      <TranslationResultsGrid
        :session="session"
        @save-success="handleSaveSuccess"
      />

      <!-- Logs Island -->
      <TranslationLogs :logs="telemetryLogs" />
    </div>
  </div>
</template>
