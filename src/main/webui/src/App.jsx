import { Router, Route, useNavigate, useLocation } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import { LayoutDashboard, Files, CircleCheck, Languages, Menu } from 'lucide-solid';
import { MetaProvider } from '@solidjs/meta';

import Dashboard from './pages/Dashboard';
import Payloads from './pages/Payloads';
import PayloadForm from './pages/PayloadForm';
import Tests from './pages/Tests';
import TestForm from './pages/TestForm';
import TestRun from './pages/TestRun';
import TestStatus from './pages/TestStatus';
import BatchStatus from './pages/BatchStatus';
import Translations from './pages/Translations';
import TranslationForm from './pages/TranslationForm';
import TranslationStatus from './pages/TranslationStatus';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

function Navigation(props) {
    const location = useLocation();
    
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <ul class="menu p-4 w-full text-base-content gap-1">
            <li>
                <a 
                    href="/" 
                    class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/') ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        props.onNavigate('/');
                    }}
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </a>
            </li>
            <li>
                <a 
                    href="/payloads" 
                    class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/payloads') ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        props.onNavigate('/payloads');
                    }}
                >
                    <Files size={18} />
                    <span>Payloads</span>
                </a>
            </li>
            <li>
                <a 
                    href="/tests" 
                    class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/tests') ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        props.onNavigate('/tests');
                    }}
                >
                    <CircleCheck size={18} />
                    <span>Tests</span>
                </a>
            </li>
            <li>
                <a 
                    href="/translations" 
                    class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/translations') ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        props.onNavigate('/translations');
                    }}
                >
                    <Languages size={18} />
                    <span>Translations</span>
                </a>
            </li>
        </ul>
    );
}

function MainLayout(props) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = createSignal(false);

    const handleNavigate = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div class="min-h-screen bg-base-300 text-base-content flex flex-col">
            {/* Header / Navbar */}
            <header class="navbar bg-base-100 border-b border-base-200 px-4 h-16 shrink-0 sticky top-0 z-30">
                <div class="flex-none md:hidden">
                    <button 
                        class="btn btn-square btn-ghost"
                        onClick={() => setSidebarOpen(!sidebarOpen())}
                    >
                        <Menu size={24} />
                    </button>
                </div>
                <div class="flex-1 px-2 mx-2">
                    <a 
                        href="/" 
                        class="text-lg font-extrabold flex items-center gap-2 cursor-pointer select-none"
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigate('/');
                        }}
                    >
                        <span>TestState</span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-primary text-primary-content">CMS</span>
                    </a>
                </div>
            </header>

            {/* Layout Wrapper */}
            <div class="flex flex-1 relative overflow-hidden">
                {/* Sidebar Drawer Container */}
                <aside 
                    class={`fixed inset-y-0 left-0 w-64 bg-base-100 border-r border-base-200 z-40 transform transition-transform duration-300 md:relative md:h-auto md:translate-x-0 ${
                        sidebarOpen() ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div class="h-full overflow-y-auto">
                        <Navigation onNavigate={handleNavigate} />
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen() && (
                    <div 
                        class="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <main class="flex-1 p-6 overflow-y-auto max-w-full">
                    {props.children}
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <MetaProvider>
                <Router root={MainLayout}>
                    <Route path="/" component={Dashboard}/>
                    <Route path="/payloads" component={Payloads}/>
                    <Route path="/payloads/new" component={PayloadForm}/>
                    <Route path="/payloads/:id/edit" component={PayloadForm}/>
                    <Route path="/tests" component={Tests}/>
                    <Route path="/tests/new" component={TestForm}/>
                    <Route path="/tests/:id/edit" component={TestForm}/>
                    <Route path="/tests/:id/run" component={TestRun}/>
                    <Route path="/tests/session/:sessionId/status" component={TestStatus}/>
                    <Route path="/tests/batch/:batchId/status" component={BatchStatus}/>
                    <Route path="/translations" component={Translations}/>
                    <Route path="/translations/new" component={TranslationForm}/>
                    <Route path="/translations/:sessionId/status" component={TranslationStatus}/>
                </Router>
            </MetaProvider>
        </QueryClientProvider>
    );
}

export default App;
