<script setup>
import { useRouter } from 'vue-router';
import { getCleanStatus, getStatusColor } from '@/utils/format';

defineProps({
  sessions: {
    type: Array,
    required: true
  }
});

const router = useRouter();

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
</template>
