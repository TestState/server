<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBatchesQuery } from '@/composables/useBatchesQuery';
import { useSessionsQuery } from '@/composables/useSessionsQuery';
import { getCleanStatus, getStatusColor } from '@/utils/format';

const router = useRouter();

const batchesQuery = useBatchesQuery();
const sessionsQuery = useSessionsQuery();

const isLoading = computed(() => batchesQuery.isPending.value || sessionsQuery.isPending.value);
const hasError = computed(() => batchesQuery.error.value || sessionsQuery.error.value);
const errorMessage = computed(() => {
  const err = batchesQuery.error.value || sessionsQuery.error.value;
  return err ? (err.message || String(err)) : '';
});

const batches = computed(() => batchesQuery.data.value || []);
const sessions = computed(() => sessionsQuery.data.value || []);

const mapColor = (status) => {
  const col = getStatusColor(status);
  if (col === 'danger') return 'error';
  if (col === 'secondary') return 'neutral';
  return col;
};
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-8 h-8 text-primary-500"
      />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading recent activity"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <!-- Batches -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Recent Batches
          </h2>
        </template>
        
        <p
          v-if="batches.length === 0"
          class="text-center text-sm text-gray-500 py-4"
        >
          No batches
        </p>
        <div
          v-else
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <div 
            v-for="batch in batches.slice(0, 8)" 
            :key="batch.batchId"
            class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4"
          >
            <div class="min-w-0 flex-1">
              <h3
                class="font-semibold text-sm truncate text-gray-700 dark:text-gray-200"
                :title="batch.testName"
              >
                {{ batch.testName }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-xs text-gray-400">{{ batch.batchId }}</span>
                <UBadge
                  :color="mapColor(batch.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ getCleanStatus(batch.status) }}
                </UBadge>
              </div>
            </div>
            <UButton 
              label="Monitor" 
              variant="link" 
              size="sm" 
              class="p-0 font-semibold"
              @click="router.push(`/tests/batch/${batch.batchId}/status`)"
            />
          </div>
        </div>
      </UCard>

      <!-- Sessions -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Recent Sessions
          </h2>
        </template>
        
        <p
          v-if="sessions.length === 0"
          class="text-center text-sm text-gray-500 py-4"
        >
          No sessions
        </p>
        <div
          v-else
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <div 
            v-for="session in sessions.slice(0, 8)" 
            :key="session.sessionId"
            class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4"
          >
            <div class="min-w-0 flex-1">
              <h3
                class="font-semibold text-sm truncate text-gray-700 dark:text-gray-200"
                :title="session.ticket?.testType || session.agentName"
              >
                {{ session.ticket?.testType || session.agentName }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-xs text-gray-400">{{ session.sessionId }}</span>
                <UBadge
                  :color="mapColor(session.status)"
                  variant="subtle"
                  size="sm"
                >
                  {{ getCleanStatus(session.status) }}
                </UBadge>
              </div>
            </div>
            <UButton 
              label="Inspect" 
              variant="link" 
              size="sm" 
              class="p-0 font-semibold"
              @click="router.push(`/tests/session/${session.sessionId}/status`)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
