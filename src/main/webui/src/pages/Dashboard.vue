<script setup>
import { defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const DashboardOverview = defineAsyncComponent(() => import('@/components/DashboardOverview.vue'));
const NodesList = defineAsyncComponent(() => import('@/components/NodesList.vue'));
const RecentActivity = defineAsyncComponent(() => import('@/components/RecentActivity.vue'));

const navigateToTests = () => {
  router.push('/tests');
};
</script>

<template>
  <div class="space-y-6 w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold tracking-tight">
        Dashboard
      </h1>
      <div class="flex gap-2">
        <UButton 
          label="New Run" 
          size="sm" 
          icon="i-lucide-play"
          @click="navigateToTests"
        />
      </div>
    </div>

    <!-- Overview Cards Island -->
    <DashboardOverview />

    <!-- Nodes List Island -->
    <NodesList />

    <!-- Recent Activity Island -->
    <RecentActivity />
  </div>
</template>
