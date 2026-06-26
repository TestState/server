<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  logs: {
    type: Array,
    required: true
  }
});

const logsContainerRef = ref(null);

watch(() => props.logs, () => {
  nextTick(() => {
    if (logsContainerRef.value) {
      logsContainerRef.value.scrollTop = logsContainerRef.value.scrollHeight;
    }
  });
}, { deep: true });
</script>

<template>
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
        v-if="logs.length === 0"
        class="text-gray-600 italic"
      >
        Awaiting telemetry logs...
      </div>
      <div v-else>
        <div 
          v-for="log in logs" 
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
</template>
