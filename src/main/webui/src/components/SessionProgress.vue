<script setup>
import { getCleanStatus, getStatusColor } from '@/utils/format';

defineProps({
  session: {
    type: Object,
    required: true
  }
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
  </UCard>
</template>
