<script setup>
import { computed } from 'vue';
import SavePayloadForm from '@/pages/SavePayloadForm.vue';

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save-success']);

const hasResult = computed(() => props.session?.generatedItems && props.session.generatedItems.length > 0);

const handleSaveSuccess = () => {
  emit('save-success');
};
</script>

<template>
  <UCard
    v-if="hasResult"
    class="shadow-sm"
  >
    <template #header>
      <h2 class="text-base font-semibold">
        Result
      </h2>
    </template>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <div 
        v-for="item in session.generatedItems" 
        :key="item.index"
        class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col justify-between"
      >
        <div class="flex justify-between items-start gap-4 mb-3">
          <div class="min-w-0 flex-1">
            <h3
              class="font-semibold text-sm truncate text-gray-800 dark:text-gray-200"
              :title="item.name || item.type"
            >
              {{ item.name || item.type }}
            </h3>
            <p class="font-mono text-xs text-gray-400 mt-0.5">
              {{ item.type }}
            </p>
          </div>
          <a
            :href="`/api/translations/sessions/${session.sessionId}/payloads/${item.index}/download`"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors shrink-0"
            download
          >
            <UIcon
              name="i-lucide-download"
              class="w-3.5 h-3.5"
            />
            <span>Download</span>
          </a>
        </div>

        <div
          v-if="item.databaseId"
          class="inline-flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 text-xs font-semibold mt-2"
        >
          <UIcon
            name="i-lucide-check"
            class="w-3.5 h-3.5"
          />
          <span>Saved in Database (ID: {{ item.databaseId }})</span>
        </div>

        <SavePayloadForm
          v-else
          :session-id="session.sessionId"
          :item="item"
          @save-success="handleSaveSuccess"
        />
      </div>
    </div>
  </UCard>
</template>
