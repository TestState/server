<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { useRouter } from 'vue-router';

const router = useRouter();
const queryClient = useQueryClient();
const formError = ref(null);

const agentId = ref('');
const type = ref('');
const payloadIds = ref([]);

const { data: agentsData, isPending: agentsPending } = useQuery({
  queryKey: ['agents'],
  queryFn: () => safeFetch('/api/agents')
});

const { data: payloadsData, isPending: payloadsPending } = useQuery({
  queryKey: ['payloads'],
  queryFn: () => safeFetch('/api/payloads')
});

const mutation = useMutation({
  mutationFn: (body) => safeFetch('/api/translations/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }),
  onSuccess: (res) => {
    queryClient.invalidateQueries({ queryKey: ['translationsSessions'] });
    if (res.sessionId) {
      router.push(`/translations/${res.sessionId}/status`);
    }
  },
  onError: (err) => {
    formError.value = err.message;
  }
});

const agents = computed(() => agentsData.value || []);
const payloads = computed(() => payloadsData.value || []);

const currentAgent = computed(() => agents.value.find(a => a.id === agentId.value));
const currentTranslation = computed(() => currentAgent.value?.supportedTranslations?.find(t => t.type === type.value));
const allowedSources = computed(() => currentTranslation.value?.sourcePayloadTypes || []);

const filteredPayloads = computed(() => {
  const t = type.value;
  const pl = payloads.value;
  const sources = allowedSources.value;
  return t ? pl.filter(p => sources.includes(p.type)) : pl;
});

const handleAgentChange = () => {
  type.value = '';
  payloadIds.value = [];
};

const handleTypeChange = () => {
  payloadIds.value = [];
};

watch([type, payloadIds, payloads, allowedSources], () => {
  const t = type.value;
  const ids = payloadIds.value;
  const pl = payloads.value;
  const sources = allowedSources.value;

  if (t && ids.length > 0) {
    const validIds = ids.filter(id => {
      const p = pl.find(x => x.id === id);
      return p && sources.includes(p.type);
    });
    if (validIds.length !== ids.length) {
      payloadIds.value = validIds;
    }
  }
}, { deep: true });

const handleSubmit = (e) => {
  e.preventDefault();
  const agId = agentId.value;
  const t = type.value;
  if (!agId) {
    formError.value = 'Please select a translation node.';
    return;
  }
  if (!t) {
    formError.value = 'Please select a translation type.';
    return;
  }
  formError.value = null;
  mutation.mutate({
    agentId: agId,
    type: t,
    payloadIds: payloadIds.value
  });
};

const handlePayloadCheck = (id, checked) => {
  if (checked) {
    if (!payloadIds.value.includes(id)) {
      payloadIds.value.push(id);
    }
  } else {
    payloadIds.value = payloadIds.value.filter(val => val !== id);
  }
};

const isLoading = computed(() => agentsPending.value || payloadsPending.value);
const error = computed(() => formError.value || mutation.error.value?.message);

const agentOptions = computed(() => agents.value.map(a => ({ label: a.name, value: a.id })));
const typeOptions = computed(() => (currentAgent.value?.supportedTranslations || []).map(t => ({ label: t.type, value: t.type })));
</script>

<template>
  <div class="max-w-3xl mx-auto w-full space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold tracking-tight">
        New Translation
      </h1>
      <UButton 
        label="Cancel" 
        color="neutral" 
        variant="outline" 
        size="sm" 
        icon="i-lucide-arrow-left"
        @click="router.push('/translations')"
      />
    </div>

    <!-- Error Banner -->
    <UAlert
      v-if="error"
      title="Error creating translation"
      :description="error"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[30vh] gap-3"
    >
      <UIcon name="i-lucide-loader-2" class="animate-spin w-10 h-10 text-primary-500" />
      <p class="text-sm text-gray-500">
        Loading translation profiles...
      </p>
    </div>

    <form
      v-else
      class="space-y-6"
      @submit="handleSubmit"
    >
      <!-- Task Card -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Task
          </h2>
        </template>

        <div class="space-y-4">
          <UFormField label="Node" required>
            <USelect 
              v-model="agentId"
              :items="agentOptions"
              placeholder="Select translation node"
              class="w-full text-sm"
              @change="handleAgentChange"
            />
          </UFormField>

          <UFormField label="Type" required>
            <USelect 
              v-model="type"
              :items="typeOptions"
              :placeholder="agentId ? 'Select translation format type' : 'Select node first'"
              :disabled="!agentId"
              class="w-full text-sm"
              @change="handleTypeChange"
            />
          </UFormField>

          <div
            v-if="currentTranslation"
            class="flex items-center gap-2 font-mono text-xs mt-2"
          >
            <span class="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">{{ allowedSources.join(', ') }}</span>
            <span>&rarr;</span>
            <span class="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">{{ currentTranslation.targetPayloadTypes?.join(', ') }}</span>
          </div>
        </div>
      </UCard>

      <!-- Payloads Card -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            Payloads
          </h2>
        </template>
        
        <div class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          <p
            v-if="filteredPayloads.length === 0"
            class="text-center text-sm text-gray-500 py-4"
          >
            No compatible payloads.
          </p>
          <div
            v-else
            class="space-y-2"
          >
            <div 
              v-for="payload in filteredPayloads" 
              :key="payload.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
              :class="payloadIds.includes(payload.id) ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50' : 'bg-gray-50 dark:bg-gray-900'"
            >
              <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                <UCheckbox 
                  :model-value="payloadIds.includes(payload.id)"
                  @update:model-value="(val) => handlePayloadCheck(payload.id, val)"
                />
                <div class="flex flex-col">
                  <span class="font-semibold text-sm text-gray-800 dark:text-gray-200">{{ payload.name }}</span>
                  <span class="font-mono text-xs text-gray-400">{{ payload.type }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </UCard>

      <UButton
        type="submit"
        label="Start Translation"
        size="md"
        icon="i-lucide-play"
        class="w-full flex justify-center"
        :disabled="!type"
        :loading="mutation.isPending.value"
      />
    </form>
  </div>
</template>
