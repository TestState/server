<script setup>
import { computed } from 'vue';
import { useTestsCountQuery } from '@/composables/useTestsCountQuery';
import { usePayloadsCountQuery } from '@/composables/usePayloadsCountQuery';
import { useAgentsCountQuery } from '@/composables/useAgentsCountQuery';
import { useSessionsCountQuery } from '@/composables/useSessionsCountQuery';
import { usePerformanceStatsQuery } from '@/composables/usePerformanceStatsQuery';

const testsCount = useTestsCountQuery();
const payloadsCount = usePayloadsCountQuery();
const agentsCount = useAgentsCountQuery();
const sessionsCount = useSessionsCountQuery();
const stats = usePerformanceStatsQuery();

const isLoading = computed(() =>
  testsCount.isPending.value ||
  payloadsCount.isPending.value ||
  agentsCount.isPending.value ||
  sessionsCount.isPending.value ||
  stats.isPending.value
);

const hasError = computed(() =>
  testsCount.error.value ||
  payloadsCount.error.value ||
  agentsCount.error.value ||
  sessionsCount.error.value ||
  stats.error.value
);

const errorMessage = computed(() => {
  const err = testsCount.error.value || payloadsCount.error.value || agentsCount.error.value || sessionsCount.error.value || stats.error.value;
  return err ? (err.message || String(err)) : '';
});

const overviewStats = computed(() => [
  { title: 'Tests', value: testsCount.data.value ?? 0 },
  { title: 'Payloads', value: payloadsCount.data.value ?? 0 },
  { title: 'Nodes', value: agentsCount.data.value ?? 0 },
  { title: 'Sessions', value: sessionsCount.data.value ?? 0 },
  { title: 'Avg Time', value: `${Number(stats.data.value?.avgNegotiationTime ?? 0).toFixed(2)} ms` },
  { title: 'Rate', value: `${Number(stats.data.value?.throughput ?? 0).toFixed(2)}/m` }
]);
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[100px] gap-3"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-8 h-8 text-primary-500"
      />
      <p class="text-sm text-gray-500">
        Loading metrics...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading overview metrics"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Overview Cards -->
    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      <UCard 
        v-for="stat in overviewStats"
        :key="stat.title"
        class="text-center shadow-sm"
        :ui="{ body: 'p-4' }"
      >
        <span class="text-xs uppercase font-bold text-gray-400">{{ stat.title }}</span>
        <span class="text-2xl font-bold block mt-1">{{ stat.value }}</span>
      </UCard>
    </div>
  </div>
</template>
