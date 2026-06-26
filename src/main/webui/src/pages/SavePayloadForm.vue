<script setup>
import { ref } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { safeFetch } from '@/utils/safeFetch';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  },
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save-success']);

const name = ref(`Translated: ${props.item.name || props.item.type}`);
const description = ref(`Translated ${props.item.type} from session ${props.sessionId}`);

const mutation = useMutation({
  mutationFn: (body) => safeFetch(`/api/translations/sessions/${props.sessionId}/payloads/${props.item.index}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }),
  onSuccess: () => {
    emit('save-success');
  },
  onError: (err) => {
    alert('Failed to save payload: ' + err.message);
  }
});

const handleSubmit = (e) => {
  e.preventDefault();
  const n = name.value;
  if (!n) return;
  mutation.mutate({
    name: n,
    description: description.value
  });
};
</script>

<template>
  <form
    class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3"
    @submit="handleSubmit"
  >
    <span class="text-xs text-gray-400 block font-semibold">Save as database payload:</span>
    <div class="flex flex-col gap-1.5 w-full">
      <UInput
        v-model="name"
        placeholder="Name"
        required
        class="w-full text-xs"
        size="sm"
      />
    </div>
    <div class="flex flex-col gap-1.5 w-full">
      <UInput
        v-model="description"
        placeholder="Description"
        class="w-full text-xs"
        size="sm"
      />
    </div>
    <div class="flex justify-end">
      <UButton
        type="submit"
        label="Save"
        size="xs"
        icon="i-lucide-save"
        :loading="mutation.isPending.value"
      />
    </div>
  </form>
</template>
