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
    
    <div class="space-y-1">
      <span class="text-xs text-gray-400 block">Status Message</span>
      <p class="font-semibold text-sm text-gray-800 dark:text-gray-200">
        {{ session.statusMessage || 'Awaiting agent translation...' }}
      </p>
    </div>
  </UCard>
</template>
