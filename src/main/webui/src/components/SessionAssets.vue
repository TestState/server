<script setup>
const props = defineProps({
  attachments: {
    type: Array,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  }
});

const getAttachmentDownloadUrl = (index) => {
  return `/api/tests/sessions/${props.sessionId}/attachments/${index}`;
};
</script>

<template>
  <UCard
    v-if="attachments.length > 0"
    class="shadow-sm"
  >
    <template #header>
      <h2 class="text-base font-semibold">
        Assets
      </h2>
    </template>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div 
        v-for="(attachment, idx) in attachments" 
        :key="attachment.name"
        class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center flex flex-col justify-between items-center gap-2"
      >
        <div class="w-full text-center">
          <h3
            class="font-semibold text-sm truncate text-gray-800 dark:text-gray-200"
            :title="attachment.name"
          >
            {{ attachment.name }}
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ attachment.mimeType }}
          </p>
        </div>
        <div
          v-if="attachment.mimeType?.startsWith('image/')"
          class="w-full h-28 bg-black flex items-center justify-center rounded overflow-hidden mt-1"
        >
          <img
            :src="getAttachmentDownloadUrl(idx)"
            :alt="attachment.name"
            class="max-h-full max-w-full object-contain"
          >
        </div>
        <a
          :href="getAttachmentDownloadUrl(idx)"
          :download="attachment.name"
          class="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full mt-2"
        >
          <UIcon
            name="i-lucide-download"
            class="w-3.5 h-3.5"
          />
          <span>Download</span>
        </a>
      </div>
    </div>
  </UCard>
</template>
