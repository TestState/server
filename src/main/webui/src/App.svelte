<script>
  import { Router } from 'sv-router';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Files from '@lucide/svelte/icons/files';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import Languages from '@lucide/svelte/icons/languages';
import Menu from '@lucide/svelte/icons/menu';
  import { route } from './router.js';

  const queryClient = new QueryClient();
  let sidebarOpen = $state(false);

  const isActive = (targetPath) => {
    if (targetPath === '/') {
      return route.pathname === '/';
    }
    return route.pathname.startsWith(targetPath);
  };
</script>

<QueryClientProvider client={queryClient}>
  <div class="h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 flex flex-col font-sans">
    <!-- Header / Navbar -->
    <header class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6 h-16 flex items-center justify-between shrink-0 z-30">
      <div class="flex items-center gap-4">
        <button 
          class="btn btn-sm preset-tonal-surface-500 p-2 rounded-lg md:hidden"
          onclick={() => sidebarOpen = !sidebarOpen}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <a 
          href="/" 
          class="text-xl font-black flex items-center gap-2 select-none"
        >
          <span class="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">TestState</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20">CMS</span>
        </a>
      </div>
    </header>

    <!-- Layout Wrapper -->
    <div class="flex flex-1 overflow-hidden relative">
      <!-- Desktop Sidebar -->
      <aside class="w-64 bg-surface-100 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 shrink-0 hidden md:block overflow-y-auto">
        <div class="p-4">
          <ul class="space-y-1 p-0 list-none">
            <li>
              <a 
                href="/" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="/payloads" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/payloads')}
              >
                <Files size={18} />
                <span>Payloads</span>
              </a>
            </li>
            <li>
              <a 
                href="/tests" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/tests')}
              >
                <CircleCheck size={18} />
                <span>Tests</span>
              </a>
            </li>
            <li>
              <a 
                href="/translations" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/translations')}
              >
                <Languages size={18} />
                <span>Translations</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Mobile Sidebar Drawer -->
      <aside 
        class="fixed inset-y-0 left-0 w-64 bg-surface-100 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 z-40 transform transition-transform duration-300 md:hidden overflow-y-auto"
        class:translate-x-0={sidebarOpen}
        class:-translate-x-full={!sidebarOpen}
      >
        <div class="p-4 h-full flex flex-col">
          <div class="flex items-center justify-between mb-6 pt-2">
            <span class="font-black bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Menu</span>
            <button 
              class="btn btn-sm preset-tonal-surface-500 px-2 py-1 rounded"
              onclick={() => sidebarOpen = false}
            >
              Close
            </button>
          </div>
          <ul class="space-y-1 p-0 list-none flex-1">
            <li>
              <a 
                href="/" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/')}
                onclick={() => sidebarOpen = false}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="/payloads" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/payloads')}
                onclick={() => sidebarOpen = false}
              >
                <Files size={18} />
                <span>Payloads</span>
              </a>
            </li>
            <li>
              <a 
                href="/tests" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/tests')}
                onclick={() => sidebarOpen = false}
              >
                <CircleCheck size={18} />
                <span>Tests</span>
              </a>
            </li>
            <li>
              <a 
                href="/translations" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                class:preset-filled-primary-500={isActive('/translations')}
                onclick={() => sidebarOpen = false}
              >
                <Languages size={18} />
                <span>Translations</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      {#if sidebarOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="fixed inset-0 bg-black/50 z-30 md:hidden"
          onclick={() => sidebarOpen = false}
        ></div>
      {/if}

      <!-- Main Content Area -->
      <main class="flex-1 p-6 overflow-y-auto bg-surface-50 dark:bg-surface-950">
        <Router />
      </main>
    </div>
  </div>
</QueryClientProvider>
