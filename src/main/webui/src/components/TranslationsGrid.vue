<script setup>
import { computed } from 'vue';
import { useTranslationSessionsQuery } from '@/composables/useTranslationSessionsQuery';
import { getCleanStatus, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';

const router = useRouter();

const translationSessionsQuery = useTranslationSessionsQuery();

const isLoading = computed(() => translationSessionsQuery.isPending.value);
const hasError = computed(() => translationSessionsQuery.error.value);
const errorMessage = computed(() => translationSessionsQuery.error.value?.message || String(translationSessionsQuery.error.value));
const sessions = computed(() => translationSessionsQuery.data.value || []);

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
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-10 h-10 text-primary-500"
      />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading translation sessions"
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
        v-if="sessions.length === 0"
        class="text-center py-8 shadow-sm"
      >
        <p class="text-gray-500 text-sm">
          No active translation sessions.
        </p>
        <div class="flex justify-center mt-3">
          <UButton 
            label="Start one" 
            variant="link" 
            size="sm" 
            @click="router.push('/translations/new')"
          />
        </div>
      </UCard>

      <!-- Grid View -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard 
          v-for="session in sessions" 
          :key="session.sessionId"
          class="hover:shadow-md transition-shadow flex flex-col justify-between"
          :ui="{ body: 'flex-grow flex flex-col justify-between p-5' }"
        >
          <div class="space-y-4">
            <!-- Session Title & ID -->
            <div class="flex justify-between items-start gap-4">
              <div class="min-w-0">
                <h3 
                  class="font-semibold text-base truncate text-gray-800 dark:text-gray-200"
                  :title="session.ticket?.testType || session.agentName"
                >
                  {{ session.ticket?.testType || session.agentName }}
                </h3>
                <span class="font-mono text-xs text-gray-400 block mt-0.5 truncate">
                  {{ session.sessionId }}
                </span>
              </div>
              <UBadge 
                :color="mapColor(session.status)"
                variant="subtle"
                size="sm"
              >
                {{ getCleanStatus(session.status) }}
              </UBadge>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-650 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/80">
              <div>
                <span class="text-gray-400 block">System:</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ session.systemId || 'N/A' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block">Agent:</span>
                <span
                  class="font-medium truncate block text-gray-700 dark:text-gray-300"
                  :title="session.agentName"
                >{{ session.agentName || 'N/A' }}</span>
              </div>
            </div>

            <!-- Status Message -->
            <div class="flex items-center gap-1.5 min-w-0">
              <span 
                class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                :class="session.status === 'RUNNING' ? 'bg-primary-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'"
              />
              <span
                v-if="session.statusMessage"
                class="text-xs text-gray-400 truncate"
                :title="session.statusMessage"
              >
                {{ session.statusMessage }}
              </span>
            </div>
          </div>
          
          <USeparator class="my-4" />
          
          <div class="flex justify-end">
            <UButton 
              label="Monitor" 
              color="neutral" 
              variant="outline" 
              size="sm" 
              icon="i-lucide-chevron-right"
              @click="router.push(`/translations/${session.sessionId}/status`)"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
