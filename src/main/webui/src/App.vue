<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { LayoutDashboard, Files, CircleCheck, Languages, Menu } from '@lucide/vue';

const router = useRouter();
const route = useRoute();
const sidebarOpen = ref(false);

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const handleNavigate = (path) => {
  router.push(path);
  sidebarOpen.value = false;
};
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 flex flex-col font-sans">
      <!-- Header / Navbar -->
      <header class="navbar bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <button 
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Menu :size="24" />
          </button>
          <router-link 
            to="/" 
            class="text-xl font-black flex items-center gap-2 select-none"
          >
            <span class="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">TestState</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/30">CMS</span>
          </router-link>
        </div>
      </header>

      <!-- Layout Wrapper -->
      <div class="flex flex-1 relative overflow-hidden">
        <!-- Sidebar Drawer Container -->
        <aside 
          class="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 md:relative md:h-auto md:translate-x-0"
          :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
          <div class="h-full overflow-y-auto p-4">
            <ul class="flex flex-col gap-1">
              <li>
                <a 
                  href="/" 
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium"
                  :class="isActive('/') ? 'bg-primary-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'"
                  @click.prevent="handleNavigate('/')"
                >
                  <LayoutDashboard :size="18" />
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <a 
                  href="/payloads" 
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium"
                  :class="isActive('/payloads') ? 'bg-primary-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'"
                  @click.prevent="handleNavigate('/payloads')"
                >
                  <Files :size="18" />
                  <span>Payloads</span>
                </a>
              </li>
              <li>
                <a 
                  href="/tests" 
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium"
                  :class="isActive('/tests') ? 'bg-primary-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'"
                  @click.prevent="handleNavigate('/tests')"
                >
                  <CircleCheck :size="18" />
                  <span>Tests</span>
                </a>
              </li>
              <li>
                <a 
                  href="/translations" 
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium"
                  :class="isActive('/translations') ? 'bg-primary-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'"
                  @click.prevent="handleNavigate('/translations')"
                >
                  <Languages :size="18" />
                  <span>Translations</span>
                </a>
              </li>
            </ul>
          </div>
        </aside>

        <!-- Overlay for mobile sidebar -->
        <div 
          v-if="sidebarOpen"
          class="fixed inset-0 bg-black/50 z-30 md:hidden"
          @click="sidebarOpen = false"
        />

        <!-- Main Content Area -->
        <main class="flex-1 p-6 overflow-y-auto max-w-full bg-gray-50 dark:bg-gray-900/40">
          <router-view />
        </main>
      </div>
    </div>
  </UApp>
</template>
