<script setup>
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { getCleanStatus, getStatusColor } from '@/utils/format';
import { useRouter } from 'vue-router';

const router = useRouter();

const { data: statsData, isPending: statsPending, error: statsError } = useQuery({
  queryKey: ['statistics'],
  queryFn: () => safeFetch('/api/statistics')
});

const { data: agentsData, isPending: agentsPending, error: agentsError } = useQuery({
  queryKey: ['agents'],
  queryFn: () => safeFetch('/api/agents')
});

const { data: sessionsData, isPending: sessionsPending, error: sessionsError } = useQuery({
  queryKey: ['sessions'],
  queryFn: () => safeFetch('/api/tests/sessions')
});

const { data: batchesData, isPending: batchesPending, error: batchesError } = useQuery({
  queryKey: ['batches'],
  queryFn: () => safeFetch('/api/tests/batches')
});

const { data: testsData, isPending: testsPending, error: testsError } = useQuery({
  queryKey: ['tests'],
  queryFn: () => safeFetch('/api/tests')
});

const { data: payloadsData, isPending: payloadsPending, error: payloadsError } = useQuery({
  queryKey: ['payloads'],
  queryFn: () => safeFetch('/api/payloads')
});

const isLoading = computed(() => 
  statsPending.value || 
  agentsPending.value || 
  sessionsPending.value || 
  batchesPending.value || 
  testsPending.value || 
  payloadsPending.value
);

const hasError = computed(() => 
  statsError.value || 
  agentsError.value || 
  sessionsError.value || 
  batchesError.value || 
  testsError.value || 
  payloadsError.value
);

const errorMessage = computed(() => {
  const err = statsError.value || agentsError.value || sessionsError.value || batchesError.value || testsError.value || payloadsError.value;
  return err ? (err.message || String(err)) : '';
});

const agents = computed(() => agentsData.value || []);
const batches = computed(() => batchesData.value || []);
const sessions = computed(() => sessionsData.value || []);

const overviewStats = computed(() => [
  { title: 'Tests', value: testsData.value?.length || 0 },
  { title: 'Payloads', value: payloadsData.value?.length || 0 },
  { title: 'Nodes', value: agentsData.value?.length || 0 },
  { title: 'Sessions', value: sessionsData.value?.length || 0 },
  { title: 'Avg Time', value: `${Number(statsData.value?.avgNegotiationTime ?? 0).toFixed(2)} ms` },
  { title: 'Rate', value: `${Number(statsData.value?.throughput ?? 0).toFixed(2)}/m` }
]);

const navigateToTests = () => {
  router.push('/tests');
};

const mapColor = (status) => {
  const col = getStatusColor(status);
  if (col === 'danger') return 'error';
  if (col === 'secondary') return 'neutral';
  return col;
};
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold tracking-tight">
        Dashboard
      </h1>
      <div class="flex gap-2">
        <UButton 
          label="New Run" 
          size="sm" 
          icon="i-lucide-play"
          @click="navigateToTests"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[30vh] gap-3"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin w-10 h-10 text-primary-500" />
      <p class="text-sm text-gray-500">
        Loading Dashboard metrics...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading statistics"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Content State -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Overview Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      <!-- Nodes Section -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Nodes
          </h2>
        </template>
        
        <p
          v-if="agents.length === 0"
          class="text-center text-sm text-gray-500 py-4"
        >
          No active nodes
        </p>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div 
            v-for="agent in agents" 
            :key="agent.id" 
            class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col justify-between min-h-[120px]"
          >
            <div class="space-y-2">
              <div>
                <h3 class="font-semibold text-sm">
                  {{ agent.name }}
                </h3>
                <p
                  class="font-mono text-xs text-gray-400 truncate"
                  :title="agent.id"
                >
                  {{ agent.id }}
                </p>
              </div>
              <USeparator />
              <p class="text-xs font-bold text-gray-500">
                Capabilities:
              </p>
              <div class="flex flex-wrap gap-1">
                <UBadge 
                  v-for="cap in agent.capabilities" 
                  :key="cap" 
                  size="xs"
                  :color="
                    agent.supportedTestTypes?.includes(cap) ? 'info' :
                    agent.supportedTranslations?.some(t => t.type === cap) ? 'success' :
                    'neutral'
                  "
                  variant="subtle"
                >
                  {{ cap }}
                </UBadge>
                <span
                  v-if="!agent.capabilities || agent.capabilities.length === 0"
                  class="text-xs text-gray-400"
                >None</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Batches and Sessions (2-column layout) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  </div>
</template>
