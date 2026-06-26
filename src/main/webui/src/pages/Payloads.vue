<script setup>
import { defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const PayloadsGrid = defineAsyncComponent(() => import('@/components/PayloadsGrid.vue'));
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold tracking-tight">
        Payloads
      </h1>
      <UButton 
        label="New" 
        size="sm" 
        icon="i-lucide-plus"
        @click="router.push('/payloads/new')"
      />
    </div>

    <!-- Payloads Grid Island -->
    <PayloadsGrid />
  </div>
</template>
