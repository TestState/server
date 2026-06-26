<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';
import { useRouter } from 'vue-router';

const props = defineProps({
  id: {
    type: String,
    required: false,
    default: undefined
  }
});

const router = useRouter();
const queryClient = useQueryClient();

const isEdit = computed(() => !!props.id);

// Query Context
const { data: contextData, isPending: isLoading, error: hasError } = useQuery({
  queryKey: ['test-form-context', props.id],
  queryFn: async () => {
    const [types, payloads, entity, agents] = await Promise.all([
      safeFetch('/api/tests/available-types'),
      safeFetch('/api/payloads'),
      isEdit.value ? safeFetch(`/api/tests/${props.id}`) : Promise.resolve(null),
      safeFetch('/api/agents')
    ]);
    return { types, payloads, entity, agents };
  }
});

const name = ref('');
const description = ref('');
const testType = ref('');
const payloadIds = ref([]);
const errorMsg = ref(null);

const availableTypes = computed(() => contextData.value?.types || []);
const allPayloads = computed(() => contextData.value?.payloads || []);
const entity = computed(() => contextData.value?.entity);
const agents = computed(() => contextData.value?.agents || []);

watch([contextData, availableTypes], () => {
  if (entity.value) {
    name.value = entity.value.name || '';
    description.value = entity.value.description || '';
    testType.value = entity.value.testType || '';
    payloadIds.value = entity.value.payloads?.map(p => p.id) || [];
  }
}, { immediate: true });

const saveMutation = useMutation({
  mutationFn: (body) => {
    const url = isEdit.value ? `/api/tests/${props.id}` : '/api/tests';
    const method = isEdit.value ? 'PUT' : 'POST';
    return safeFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tests-data'] });
    router.push('/tests');
  },
  onError: (err) => {
    errorMsg.value = err.message;
  }
});

const copyMutation = useMutation({
  mutationFn: () => safeFetch(`/api/tests/${props.id}/copy`, { method: 'POST' }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tests-data'] });
    router.push('/tests');
  },
  onError: (err) => {
    alert('Failed to duplicate test: ' + err.message);
  }
});

const getPayloadRequirement = (payloadType) => {
  const tType = testType.value;
  const ags = agents.value;
  if (!tType || !ags) return null;
  const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
  ags.forEach(agent => {
    const test = agent.supportedTests?.find(t => t.testType === tType);
    if (test) {
      test.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
      test.optionalPayloadTypes?.forEach(o => {
        if (requirements.get(o) !== 'REQUIRED') {
          requirements.set(o, 'RECOMMENDED');
        }
      });
    }
  });
  return requirements.get(payloadType) || null;
};

const handleCheck = (payloadId, checked) => {
  if (checked) {
    if (!payloadIds.value.includes(payloadId)) {
      payloadIds.value.push(payloadId);
    }
  } else {
    payloadIds.value = payloadIds.value.filter(val => val !== payloadId);
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  errorMsg.value = null;

  if (!name.value) {
    errorMsg.value = "Name is required";
    return;
  }
  if (!testType.value) {
    errorMsg.value = "Type is required";
    return;
  }

  saveMutation.mutate({
    name: name.value,
    description: description.value,
    testType: testType.value,
    payloadIds: payloadIds.value
  });
};

const errorMessage = computed(() => hasError.value?.message || String(hasError.value));
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
        Loading Form data...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading test data"
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
        <h1 class="text-2xl font-bold tracking-tight">
          {{ isEdit ? 'Edit Test' : 'New Test' }}
        </h1>
        <div class="flex gap-2">
          <UButton
            v-if="isEdit"
            label="Copy"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-copy"
            :loading="copyMutation.isPending.value"
            @click="copyMutation.mutate()"
          />
          <UButton 
            label="Return" 
            color="neutral" 
            variant="outline" 
            size="sm" 
            icon="i-lucide-arrow-left"
            @click="router.push('/tests')"
          />
        </div>
      </div>

      <!-- Error banner -->
      <UAlert
        v-if="errorMsg"
        title="Error saving test"
        :description="errorMsg"
        color="error"
        variant="solid"
        class="w-full"
      />

      <form
        class="space-y-6"
        @submit="handleSubmit"
      >
        <!-- Settings Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Settings
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Name"
              required
            >
              <UInput
                v-model="name"
                placeholder="Enter test name"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Description">
              <UTextarea
                v-model="description"
                placeholder="Enter description"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Type"
              required
            >
              <UInput
                v-model="testType"
                placeholder="Select or enter test type"
                required
                class="w-full"
                list="available-test-types"
              />
              <datalist id="available-test-types">
                <option
                  v-for="item in availableTypes"
                  :key="item"
                  :value="item"
                />
              </datalist>
            </UFormField>
          </div>
        </UCard>

        <!-- Payloads Card -->
        <UCard class="shadow-sm">
          <template #header>
            <h2 class="text-base font-semibold">
              Payloads
            </h2>
          </template>

          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-if="allPayloads.length === 0"
              class="text-center py-6 text-sm text-gray-500"
            >
              <span>Empty. </span>
              <UButton
                label="New"
                variant="link"
                size="sm"
                class="p-0 font-semibold"
                @click="router.push('/payloads/new')"
              />
            </div>
            <div
              v-else
              class="space-y-2"
            >
              <div 
                v-for="payload in allPayloads" 
                :key="payload.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
                :class="payloadIds.includes(payload.id) ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/50' : 'bg-gray-50 dark:bg-gray-900'"
              >
                <label class="cursor-pointer flex justify-start items-center gap-3 w-full select-none">
                  <UCheckbox 
                    :model-value="payloadIds.includes(payload.id)"
                    @update:model-value="(val) => handleCheck(payload.id, val)"
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
          label="Save"
          size="md"
          icon="i-lucide-save"
          class="w-full flex justify-center"
          :loading="saveMutation.isPending.value"
        />
      </form>
    </div>
  </div>
</template>
