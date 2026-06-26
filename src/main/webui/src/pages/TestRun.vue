<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { useRouter } from 'vue-router';

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const router = useRouter();

// Run Context Query
const { data: contextData, isPending: isLoading, error: hasError } = useQuery({
  queryKey: ['test-run-context', props.id],
  queryFn: async () => {
    const [test, agents, payloads] = await Promise.all([
      safeFetch(`/api/tests/${props.id}`),
      safeFetch('/api/agents'),
      safeFetch('/api/payloads')
    ]);

    const compatibleTypes = new Set();
    agents.forEach(agent => {
      const t = agent.supportedTests?.find(st => st.testType === test.testType);
      if (t) {
        t.requiredPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
        t.optionalPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
      }
    });

    const linkedIds = new Set(test.payloads?.map(p => p.id) || []);
    const extraPayloads = payloads.filter(p => !linkedIds.has(p.id) && compatibleTypes.has(p.type));

    return { test, agents, extraPayloads };
  }
});

const test = computed(() => contextData.value?.test || {});
const agents = computed(() => contextData.value?.agents || []);
const extraPayloads = computed(() => contextData.value?.extraPayloads || []);

const agentIds = ref([]);
const extraPayloadIds = ref([]);
const iterations = ref(1);
const strategy = ref('sequential');
const errorMsg = ref(null);

watch(agents, () => {
  // Select first compatible agent by default if none selected
  const compatible = agents.value.filter(a => a.supportedTestTypes?.includes(test.value.testType));
  if (compatible.length > 0 && agentIds.value.length === 0) {
    agentIds.value = [compatible[0].id];
  }
}, { immediate: true });

const runMutation = useMutation({
  mutationFn: (body) => safeFetch(`/api/tests/${props.id}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }),
  onSuccess: (res) => {
    if (res.batchId) {
      router.push(`/tests/batch/${res.batchId}/status`);
    } else if (res.sessionId) {
      router.push(`/tests/session/${res.sessionId}/status`);
    }
  },
  onError: (err) => {
    errorMsg.value = 'Failed to trigger run: ' + err.message;
  }
});

const getPayloadRequirement = (payloadType) => {
  const ags = agents.value;
  const t = test.value;
  if (!ags || !t) return null;
  const requirements = new Map();
  ags.forEach(agent => {
    if (agentIds.value.length > 0 && !agentIds.value.includes(agent.id)) return;

    const st = agent.supportedTests?.find(tt => tt.testType === t.testType);
    if (st) {
      st.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
      st.optionalPayloadTypes?.forEach(o => {
        if (requirements.get(o) !== 'REQUIRED') {
          requirements.set(o, 'RECOMMENDED');
        }
      });
    }
  });
  return requirements.get(payloadType) || null;
};

const handleAgentCheck = (agentId, checked) => {
  if (checked) {
    if (!agentIds.value.includes(agentId)) {
      agentIds.value.push(agentId);
    }
  } else {
    agentIds.value = agentIds.value.filter(id => id !== agentId);
  }
};

const handleExtraCheck = (extraId, checked) => {
  if (checked) {
    if (!extraPayloadIds.value.includes(extraId)) {
      extraPayloadIds.value.push(extraId);
    }
  } else {
    extraPayloadIds.value = extraPayloadIds.value.filter(id => id !== extraId);
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  errorMsg.value = null;

  if (agentIds.value.length === 0) {
    errorMsg.value = 'Please select at least one agent node.';
    return;
  }

  runMutation.mutate({
    agentIds: agentIds.value,
    extraPayloadIds: extraPayloadIds.value,
    iterations: parseInt(iterations.value) || 1,
    parallel: strategy.value === 'parallel'
  });
};

const errorMessage = computed(() => hasError.value?.message || String(hasError.value));

const strategyOptions = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'parallel', label: 'Parallel' }
];
</script>

<template>
  <div class="max-w-3xl mx-auto w-full space-y-6">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[30vh] gap-3"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin w-10 h-10 text-primary-500"
      />
      <p class="text-sm text-gray-500">
        Loading Run context...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading run details"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <div
      v-else
      class="space-y-6"
    >
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div class="space-y-0.5">
          <h1 class="text-2xl font-bold tracking-tight">
            New Test Session
          </h1>
          <p class="font-mono text-xs text-gray-400">
            {{ test.name }}
          </p>
        </div>
        <UButton 
          label="Return" 
          color="neutral" 
          variant="outline" 
          size="sm" 
          icon="i-lucide-arrow-left"
          @click="router.push('/tests')"
        />
      </div>

      <!-- Error banner -->
      <UAlert
        v-if="errorMsg"
        title="Error triggering run"
        :description="errorMsg"
        color="error"
        variant="solid"
        class="w-full"
      />

      <form
        class="space-y-6"
        @submit="handleSubmit"
      >
        <!-- Nodes Selection Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Nodes
            </h2>
          </template>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <p
              v-if="agents.length === 0"
              class="text-center text-sm text-gray-500 py-4"
            >
              No active agents.
            </p>
            <div
              v-else
              class="space-y-2"
            >
              <div 
                v-for="agent in agents" 
                :key="agent.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
                :class="agentIds.includes(agent.id) ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50' : 'bg-gray-50 dark:bg-gray-900'"
                :style="{ opacity: agent.supportedTestTypes?.includes(test.testType) ? 1 : 0.5 }"
              >
                <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                  <UCheckbox 
                    :model-value="agentIds.includes(agent.id)"
                    :disabled="!agent.supportedTestTypes?.includes(test.testType)"
                    @update:model-value="(val) => handleAgentCheck(agent.id, val)"
                  />
                  <div class="flex flex-col">
                    <span class="font-semibold text-sm text-gray-800 dark:text-gray-200">{{ agent.name }}</span>
                    <span class="font-mono text-xs text-gray-400">{{ agent.id }}</span>
                  </div>
                </label>
                <UBadge 
                  size="sm"
                  :color="agent.supportedTestTypes?.includes(test.testType) ? 'success' : 'error'"
                  variant="subtle"
                  class="shrink-0"
                >
                  {{ agent.supportedTestTypes?.includes(test.testType) ? 'Ready' : 'Incompatible' }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Settings Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Settings
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Iterations">
              <UInput
                v-model="iterations"
                type="number"
                min="1"
                max="1000"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Strategy">
              <URadioGroup
                v-model="strategy"
                :items="strategyOptions"
                class="mt-1"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Linked Payloads Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Linked Payloads
            </h2>
          </template>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <p
              v-if="!test.payloads || test.payloads.length === 0"
              class="text-center text-sm text-gray-500 py-4"
            >
              No linked payloads.
            </p>
            <div
              v-else
              class="divide-y divide-gray-200 dark:divide-gray-800"
            >
              <div 
                v-for="payload in test.payloads" 
                :key="payload.id"
                class="flex justify-between items-center py-2.5 first:pt-0 last:pb-0"
              >
                <span class="font-semibold text-sm text-gray-700 dark:text-gray-200">{{ payload.name }}</span>
                <UBadge 
                  color="warning" 
                  variant="subtle" 
                  size="sm"
                >
                  {{ payload.type }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Extra Payloads Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Extra Payloads
            </h2>
          </template>
          
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <p
              v-if="extraPayloads.length === 0"
              class="text-center text-sm text-gray-500 py-4"
            >
              No compatible extras available.
            </p>
            <div
              v-else
              class="space-y-2"
            >
              <div 
                v-for="payload in extraPayloads" 
                :key="payload.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
                :class="extraPayloadIds.includes(payload.id) ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50' : 'bg-gray-50 dark:bg-gray-900'"
              >
                <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                  <UCheckbox 
                    :model-value="extraPayloadIds.includes(payload.id)"
                    @update:model-value="(val) => handleExtraCheck(payload.id, val)"
                  />
                  <div class="flex flex-col">
                    <span class="font-semibold text-sm text-gray-800 dark:text-gray-200">{{ payload.name }}</span>
                    <span class="font-mono text-xs text-gray-400">{{ payload.type }}</span>
                  </div>
                </label>
                <UBadge 
                  v-if="getPayloadRequirement(payload.type)"
                  size="sm"
                  :color="getPayloadRequirement(payload.type) === 'REQUIRED' ? 'error' : 'success'"
                  variant="subtle"
                  class="shrink-0"
                >
                  {{ getPayloadRequirement(payload.type) }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <UButton
          type="submit"
          label="Start Run"
          size="md"
          icon="i-lucide-play"
          class="w-full flex justify-center"
          :loading="runMutation.isPending.value"
        />
      </form>
    </div>
  </div>
</template>
