<script setup>
import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useTestsQuery } from '@/composables/useTestsQuery';
import { useSessionsQuery } from '@/composables/useSessionsQuery';
import { useBatchesQuery } from '@/composables/useBatchesQuery';
import { safeFetch } from '@/utils/safeFetch';
import { getCleanStatus, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';

const router = useRouter();
const queryClient = useQueryClient();

const testsQuery = useTestsQuery();
const sessionsQuery = useSessionsQuery();
const batchesQuery = useBatchesQuery();

const deleteMutation = useMutation({
  mutationFn: (id) => safeFetch(`/api/tests/${id}`, { method: 'DELETE' }),
  onSuccess: () => {
    alert('Test configuration deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['tests'] });
  },
  onError: (err) => {
    alert('Failed to delete test: ' + err.message);
  }
});

const copyMutation = useMutation({
  mutationFn: (id) => safeFetch(`/api/tests/${id}/copy`, { method: 'POST' }),
  onSuccess: () => {
    alert('Test configuration duplicated successfully');
    queryClient.invalidateQueries({ queryKey: ['tests'] });
  },
  onError: (err) => {
    alert('Failed to duplicate test: ' + err.message);
  }
});

const handleDelete = (id) => {
  if (window.confirm('Are you sure you want to delete this test configuration?')) {
    deleteMutation.mutate(id);
  }
};

const isLoading = computed(() => testsQuery.isPending.value || sessionsQuery.isPending.value || batchesQuery.isPending.value);
const hasError = computed(() => testsQuery.error.value || sessionsQuery.error.value || batchesQuery.error.value);
const errorMessage = computed(() => {
  const err = testsQuery.error.value || sessionsQuery.error.value || batchesQuery.error.value;
  return err ? (err.message || String(err)) : '';
});

const tests = computed(() => testsQuery.data.value || []);
const sessions = computed(() => sessionsQuery.data.value || []);
const batches = computed(() => batchesQuery.data.value || []);

const hasBatches = computed(() => batches.value.length > 0);
const hasSessions = computed(() => sessions.value.length > 0);

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
      class="flex flex-col items-center justify-center min-h-[30vh] gap-3"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-10 h-10 text-primary-500"
      />
      <p class="text-sm text-gray-500">
        Loading test suites...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading tests"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <div
      v-else
      class="space-y-6"
    >
      <!-- Empty State -->
      <UCard
        v-if="tests.length === 0"
        class="text-center py-8 shadow-sm"
      >
        <p class="text-gray-500 text-sm">
          No tests configured.
        </p>
        <div class="flex justify-center mt-3">
          <UButton 
            label="Create New" 
            variant="link" 
            size="sm" 
            @click="router.push('/tests/new')"
          />
        </div>
      </UCard>

      <!-- Grid View -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard 
          v-for="test in tests" 
          :key="test.id"
          class="hover:shadow-md transition-shadow flex flex-col justify-between"
          :ui="{ body: 'flex-grow flex flex-col justify-between p-5' }"
        >
          <div class="space-y-3 flex-grow">
            <div class="flex justify-between items-start gap-4">
              <h2
                class="text-base font-bold truncate text-gray-800 dark:text-gray-100"
                :title="test.name"
              >
                {{ test.name }}
              </h2>
              <UBadge 
                color="primary" 
                variant="subtle" 
                size="sm"
              >
                {{ test.testType }}
              </UBadge>
            </div>
            <p class="text-xs text-gray-400">
              {{ test.payloads?.length || 0 }} linked
            </p>
            <p
              v-if="test.description"
              class="text-xs text-gray-500 dark:text-gray-400 line-clamp-3"
            >
              {{ test.description }}
            </p>
          </div>
          
          <USeparator class="my-4" />
          
          <div class="flex flex-wrap justify-end items-center gap-2">
            <UButton 
              label="Run" 
              size="sm" 
              icon="i-lucide-play"
              @click="router.push(`/tests/${test.id}/run`)"
            />
            <UButton 
              label="Copy" 
              color="neutral" 
              variant="outline"
              size="sm" 
              icon="i-lucide-copy"
              :loading="copyMutation.isPending.value && copyMutation.variables.value === test.id"
              @click="copyMutation.mutate(test.id)"
            />
            <UButton 
              label="Edit" 
              color="neutral" 
              variant="outline"
              size="sm" 
              icon="i-lucide-edit"
              @click="router.push(`/tests/${test.id}/edit`)"
            />
            <UButton 
              label="Delete" 
              color="error" 
              variant="outline"
              size="sm" 
              icon="i-lucide-trash"
              :loading="deleteMutation.isPending.value && deleteMutation.variables.value === test.id"
              @click="handleDelete(test.id)"
            />
          </div>
        </UCard>
      </div>

      <!-- Batches and Sessions History -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UCard
          v-if="hasBatches"
          class="shadow-sm"
        >
          <template #header>
            <h2 class="text-base font-semibold">
              Recent Batches
            </h2>
          </template>
          
          <div class="divide-y divide-gray-200 dark:divide-gray-800">
            <div 
              v-for="batch in batches" 
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

        <UCard
          v-if="hasSessions"
          class="shadow-sm"
        >
          <template #header>
            <h2 class="text-base font-semibold">
              Recent Sessions
            </h2>
          </template>
          
          <div class="divide-y divide-gray-200 dark:divide-gray-800">
            <div 
              v-for="session in sessions" 
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
  </div>
</template>
