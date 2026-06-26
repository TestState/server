<script setup>
import { ref } from 'vue';
import { getCleanStatus, getDisplayDuration, getStatusColor } from '@/utils/format';

defineProps({
  reports: {
    type: Array,
    required: true
  }
});

const expandedSteps = ref({});

const toggleStep = (stepName) => {
  expandedSteps.value[stepName] = !expandedSteps.value[stepName];
};

const mapColor = (status) => {
  const col = getStatusColor(status);
  if (col === 'danger') return 'error';
  if (col === 'secondary') return 'neutral';
  return col;
};
</script>

<template>
  <div
    v-if="reports.length > 0"
    class="space-y-2 pt-4"
  >
    <h3 class="font-semibold text-sm">
      Execution Steps
    </h3>
    <div class="space-y-2">
      <div 
        v-for="step in reports" 
        :key="step.name"
        class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50"
      >
        <div 
          class="flex justify-between items-center p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          @click="toggleStep(step.name)"
        >
          <div class="flex items-center gap-2">
            <UBadge
              :color="mapColor(step.status)"
              variant="subtle"
              size="sm"
            >
              {{ getCleanStatus(step.status || 'PENDING') }}
            </UBadge>
            <span class="font-bold text-sm text-gray-700 dark:text-gray-200">{{ step.name || 'Unnamed Step' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-gray-400">{{ getDisplayDuration(step.summary?.totalDuration ?? 0) }}</span>
            <UIcon
              :name="expandedSteps[step.name] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="text-gray-400 w-4 h-4"
            />
          </div>
        </div>

        <div
          v-if="expandedSteps[step.name]"
          class="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 space-y-3"
        >
          <pre 
            v-if="step.summary?.metadata && Object.keys(step.summary.metadata).length > 0"
            class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono"
          >{{ JSON.stringify(step.summary.metadata, null, 2) }}</pre>

          <!-- Substeps recursion -->
          <div
            v-if="step.steps && step.steps.length > 0"
            class="pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-2"
          >
            <div 
              v-for="subStep in step.steps" 
              :key="subStep.name"
              class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50"
            >
              <div 
                class="flex justify-between items-center p-2.5 cursor-pointer select-none"
                @click="toggleStep(subStep.name)"
              >
                <div class="flex items-center gap-2">
                  <UBadge
                    :color="mapColor(subStep.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ getCleanStatus(subStep.status || 'PENDING') }}
                  </UBadge>
                  <span class="font-semibold text-xs text-gray-700 dark:text-gray-200">{{ subStep.name || 'Unnamed Substep' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs text-gray-400">{{ getDisplayDuration(subStep.summary?.totalDuration ?? 0) }}</span>
                  <UIcon
                    :name="expandedSteps[subStep.name] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="text-gray-400 w-3.5 h-3.5"
                  />
                </div>
              </div>
              <div
                v-if="expandedSteps[subStep.name]"
                class="p-3 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
              >
                <pre 
                  v-if="subStep.summary?.metadata && Object.keys(subStep.summary.metadata).length > 0"
                  class="bg-black text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono"
                >{{ JSON.stringify(subStep.summary.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
