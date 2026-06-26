<script setup>
import { computed } from 'vue';
import { useAgentsQuery } from '@/composables/useAgentsQuery';

const agentsQuery = useAgentsQuery();

const isLoading = computed(() => agentsQuery.isPending.value);
const hasError = computed(() => agentsQuery.error.value);
const errorMessage = computed(() => agentsQuery.error.value?.message || String(agentsQuery.error.value));

const agents = computed(() => agentsQuery.data.value || []);
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
      title="Error loading nodes"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Nodes Section -->
    <UCard
      v-else
      class="shadow-sm"
    >
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
  </div>
</template>
