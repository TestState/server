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

const name = ref('');
const description = ref('');
const type = ref('');
const metadata = ref('');
const attachmentFile = ref(null);
const errorMsg = ref(null);

// Queries
const { data: availableTypes } = useQuery({
  queryKey: ['payloadAvailableTypes'],
  queryFn: () => safeFetch('/api/payloads/available-types')
});

const { data: mimeMappings } = useQuery({
  queryKey: ['payloadMimeMappings'],
  queryFn: () => safeFetch('/api/payloads/mime-mappings')
});

const { data: entity, isPending: isEntityPending } = useQuery({
  queryKey: ['payload', props.id],
  queryFn: () => safeFetch(`/api/payloads/${props.id}`),
  enabled: isEdit
});

const types = computed(() => availableTypes.value || []);
const mappings = computed(() => mimeMappings.value || {});

watch([entity, types], () => {
  if (entity.value) {
    name.value = entity.value.name || '';
    description.value = entity.value.description || '';
    type.value = entity.value.type || '';
    metadata.value = entity.value.metadata || '';
  }
}, { immediate: true });

const saveMutation = useMutation({
  mutationFn: (payloadForm) => {
    const url = isEdit.value ? `/api/payloads/${props.id}` : '/api/payloads';
    const method = isEdit.value ? 'PUT' : 'POST';
    return safeFetch(url, {
      method: method,
      body: payloadForm
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['payloads'] });
    router.push('/payloads');
  },
  onError: (err) => {
    errorMsg.value = err.message;
  }
});

const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    attachmentFile.value = e.target.files[0];
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  errorMsg.value = null;

  if (!name.value) {
    errorMsg.value = "Name is required";
    return;
  }
  if (!type.value) {
    errorMsg.value = "Type is required";
    return;
  }

  const file = attachmentFile.value;
  const t = type.value;
  const currentMappings = mappings.value;

  if (file && t && currentMappings[t]) {
    const allowedMimeTypes = currentMappings[t];
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      errorMsg.value = `Unsupported file type: ${file.type} for type ${t}. Expected: ${allowedMimeTypes.join(', ')}`;
      return;
    }
  }

  const payloadForm = new FormData();
  payloadForm.append('name', name.value);
  payloadForm.append('description', description.value);
  payloadForm.append('type', t);
  payloadForm.append('metadata', metadata.value);
  if (file) {
    payloadForm.append('attachmentFile', file);
  }

  saveMutation.mutate(payloadForm);
};

const isLoading = computed(() => isEdit.value && isEntityPending.value);
</script>

<template>
  <div class="max-w-3xl mx-auto w-full space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold tracking-tight">
        {{ isEdit ? 'Edit Payload' : 'New Payload' }}
      </h1>
      <UButton 
        label="Return" 
        color="neutral" 
        variant="outline" 
        size="sm" 
        icon="i-lucide-arrow-left"
        @click="router.push('/payloads')"
      />
    </div>

    <!-- Error Banner -->
    <UAlert
      v-if="errorMsg"
      title="Error saving payload"
      :description="errorMsg"
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
        Loading Form data...
      </p>
    </div>

    <form
      v-else
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
          <UFormField label="Name" required>
            <UInput
              v-model="name"
              placeholder="Enter payload name"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="description"
              placeholder="Enter description"
              :rows="2"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Type" required>
            <UInput
              v-model="type"
              placeholder="Select or enter payload type"
              required
              class="w-full"
              list="available-types"
            />
            <datalist id="available-types">
              <option
                v-for="item in types"
                :key="item"
                :value="item"
              />
            </datalist>
          </UFormField>

          <UFormField label="Metadata">
            <UTextarea
              v-model="metadata"
              placeholder='{ "key": "value" }'
              :rows="5"
              class="w-full font-mono text-xs"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- File Card -->
      <UCard class="shadow-sm">
        <template #header>
          <h2 class="text-base font-semibold">
            File
          </h2>
        </template>

        <div class="space-y-4">
          <div
            v-if="isEdit && entity?.attachmentName"
            class="flex items-center gap-2 text-sm"
          >
            <span class="text-gray-500">Current Asset:</span>
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ entity.attachmentName }}</span>
          </div>

          <UFormField 
            label="Upload File"
            :description="type && mappings[type] && mappings[type].length > 0 ? `Supported formats for ${type}: ${mappings[type].join(', ')}` : ''"
          >
            <input
              type="file"
              class="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                dark:file:bg-primary-950/30 dark:file:text-primary-400
                hover:file:bg-primary-100 dark:hover:file:bg-primary-950/50
                cursor-pointer border border-gray-300 dark:border-gray-700 rounded-lg p-1.5"
              @change="handleFileChange"
            >
          </UFormField>
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
</template>
