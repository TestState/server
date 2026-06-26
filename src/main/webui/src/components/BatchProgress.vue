<script setup>
import { computed } from 'vue';
import { getCleanStatus, getStatusColor } from '@/utils/format';

const props = defineProps({
  batch: {
    type: Object,
    required: true
  }
});

const sessions = computed(() => props.batch?.sessions || []);
const total = computed(() => props.batch?.iterations || 0);

const passed = computed(() => 
  props.batch?.passedCount !== undefined 
    ? props.batch.passedCount 
    : sessions.value.filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length
);

const failed = computed(() => 
  props.batch?.failedCount !== undefined 
    ? props.batch.failedCount 
    : sessions.value.filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length
);

const running = computed(() => 
  props.batch?.runningCount !== undefined 
    ? props.batch.runningCount 
    : sessions.value.filter(s => s.status?.includes('RUNNING')).length
);

const pending = computed(() => 
  props.batch?.pendingCount !== undefined 
    ? props.batch.pendingCount 
    : Math.max(0, total.value - (passed.value + failed.value) - running.value)
);

const rate = computed(() => {
  const r = props.batch?.throughput;
  return typeof r === 'number' ? r.toFixed(2) : r || '0.00';
});

const time = computed(() => {
  const t = props.batch?.averageNegotiationDuration;
  return typeof t === 'number' ? t.toFixed(2) : t || '0.00';
});

const mapColor = (status) => {
  const col = getStatusColor(status);
  if (col === 'danger') return 'error';
  if (col === 'secondary') return 'neutral';
  return col;
};
</script>

<template>
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
</template>
