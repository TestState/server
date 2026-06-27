<script>
  import { navigate } from '@/router.js';
  import DashboardOverview from '../components/DashboardOverview.svelte';
  import NodesList from '../components/NodesList.svelte';
  import RecentActivity from '../components/RecentActivity.svelte';
  import Play from '@lucide/svelte/icons/play';
</script>

<div class="space-y-6 w-full">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
    <div>
      <button 
        class="btn btn-sm preset-filled-primary-500 flex items-center gap-2"
        onclick={() => navigate('/tests')}
      >
        <Play size={16} />
        New Run
      </button>
    </div>
  </div>

  <!-- Overview Cards Island -->
  <DashboardOverview />

  <!-- Nodes List Island -->
  <NodesList />

  <!-- Recent Activity Island -->
  <RecentActivity />
</div>
