<script setup>
import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { usePayloadsQuery } from '@/composables/usePayloadsQuery';
import { safeFetch } from '@/utils/safeFetch';
import { useRouter } from 'vue-router';

const router = useRouter();
const queryClient = useQueryClient();

const payloadsQuery = usePayloadsQuery();

const deleteMutation = useMutation({
  mutationFn: (id) => safeFetch(`/api/payloads/${id}`, { method: 'DELETE' }),
  onSuccess: () => {
    alert('Payload deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['payloads'] });
  },
  onError: (err) => {
    alert('Failed to delete payload: ' + err.message);
  }
});

const handleDelete = (id) => {
  if (window.confirm('Are you sure you want to delete this payload?')) {
    deleteMutation.mutate(id);
  }
};

const handleExport = (id, filename) => {
  const a = document.createElement('a');
  a.href = `/api/payloads/${id}/attachment`;
  a.download = filename || 'attachment';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const isLoading = computed(() => payloadsQuery.isPending.value);
const hasError = computed(() => payloadsQuery.error.value);
const errorMessage = computed(() => payloadsQuery.error.value?.message || String(payloadsQuery.error.value));
const payloads = computed(() => payloadsQuery.data.value || []);
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
        Loading payloads...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="hasError"
      title="Error loading payloads"
      :description="errorMessage"
      color="error"
      variant="solid"
      class="w-full"
    />

    <!-- Empty State -->
    <UCard
      v-else-if="payloads.length === 0"
      class="text-center py-8 shadow-sm"
    >
      <p class="text-gray-500 text-sm">
        No payloads configured.
      </p>
      <div class="flex justify-center mt-3">
        <UButton 
          label="Create New" 
          variant="link" 
          size="sm" 
          @click="router.push('/payloads/new')"
        />
      </div>
    </UCard>

    <!-- Grid View -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard 
        v-for="payload in payloads" 
        :key="payload.id"
        class="hover:shadow-md transition-shadow flex flex-col justify-between"
        :ui="{ body: 'flex-grow flex flex-col justify-between p-5' }"
      >
        <div class="space-y-3 flex-grow">
          <div class="flex justify-between items-start gap-4">
            <h2
              class="text-base font-bold truncate text-gray-800 dark:text-gray-100"
              :title="payload.name"
            >
              {{ payload.name }}
            </h2>
            <UBadge 
              color="warning" 
              variant="subtle" 
              size="sm"
            >
              {{ payload.type }}
            </UBadge>
          </div>
          <p
            v-if="payload.description"
            class="text-xs text-gray-500 dark:text-gray-400 line-clamp-3"
          >
            {{ payload.description }}
          </p>
        </div>
        
        <USeparator class="my-4" />
        
        <div class="flex justify-end items-center gap-2">
          <UButton 
            v-if="payload.attachmentName"
            label="Export" 
            color="neutral"
            variant="outline"
            size="sm" 
            icon="i-lucide-download"
            @click="handleExport(payload.id, payload.attachmentName)"
          />
          <UButton 
            label="Edit" 
            color="neutral"
            variant="outline"
            size="sm" 
            icon="i-lucide-edit"
            @click="router.push(`/payloads/${payload.id}/edit`)"
          />
          <UButton 
            label="Delete" 
            color="error"
            variant="outline"
            size="sm" 
            icon="i-lucide-trash"
            :loading="deleteMutation.isPending.value && deleteMutation.variables.value === payload.id"
            @click="handleDelete(payload.id)"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>
