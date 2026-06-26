<script setup>
import { defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const TestsGrid = defineAsyncComponent(() => import('@/components/TestsGrid.vue'));
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold tracking-tight">
        Tests
      </h1>
      <UButton 
        label="New" 
        size="sm" 
        icon="i-lucide-plus"
        @click="router.push('/tests/new')"
      />
    </div>

    <!-- Tests Grid Island -->
    <TestsGrid />
  </div>
</template>
