import React from 'react';
import {BrowserRouter as Router, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AppShell, Burger, createTheme, Group, MantineProvider, NavLink, Text} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconCircleCheck, IconFiles, IconLanguage, IconLayoutDashboard} from '@tabler/icons-react';

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

const theme = createTheme({
    fontFamily: 'Outfit, sans-serif',
    headings: {
        fontFamily: 'Outfit, sans-serif',
    },
    primaryColor: 'blue',
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

function Navigation({closeNavbar}) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path) => {
        navigate(path);
        closeNavbar();
    };

    return (
        <>
            <NavLink
                label="Dashboard"
                leftSection={<IconLayoutDashboard size="1rem" stroke={1.5}/>}
                active={location.pathname === '/'}
                onClick={() => handleNavigate('/')}
            />
            <NavLink
                label="Payloads"
                leftSection={<IconFiles size="1rem" stroke={1.5}/>}
                active={location.pathname.startsWith('/payloads')}
                onClick={() => handleNavigate('/payloads')}
            />
            <NavLink
                label="Tests"
                leftSection={<IconCircleCheck size="1rem" stroke={1.5}/>}
                active={location.pathname.startsWith('/tests')}
                onClick={() => handleNavigate('/tests')}
            />
            <NavLink
                label="Translations"
                leftSection={<IconLanguage size="1rem" stroke={1.5}/>}
                active={location.pathname.startsWith('/translations')}
                onClick={() => handleNavigate('/translations')}
            />
        </>
    );
}

function MainLayout() {
    const [opened, {toggle, close}] = useDisclosure();
    const navigate = useNavigate();

    return (
        <AppShell
            header={{height: 60}}
            navbar={{
                width: 240,
                breakpoint: 'sm',
                collapsed: {mobile: !opened},
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
                    <Text size="lg" fw={800} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}} onClick={() => navigate('/')}>
                        TestState <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: '#1c7ed6',
                        color: '#fff',
                        marginLeft: 6
                    }}>CMS</span>
                    </Text>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Navigation closeNavbar={close}/>
            </AppShell.Navbar>

            <AppShell.Main>
                <Routes>
                    <Route path="/" element={<Dashboard/>}/>

                    <Route path="/payloads" element={<Payloads/>}/>
                    <Route path="/payloads/new" element={<PayloadForm/>}/>
                    <Route path="/payloads/:id/edit" element={<PayloadForm/>}/>

                    <Route path="/tests" element={<Tests/>}/>
                    <Route path="/tests/new" element={<TestForm/>}/>
                    <Route path="/tests/:id/edit" element={<TestForm/>}/>
                    <Route path="/tests/:id/run" element={<TestRun/>}/>
                    <Route path="/tests/session/:sessionId/status" element={<TestStatus/>}/>
                    <Route path="/tests/batch/:batchId/status" element={<BatchStatus/>}/>

                    <Route path="/translations" element={<Translations/>}/>
                    <Route path="/translations/new" element={<TranslationForm/>}/>
                    <Route path="/translations/:sessionId/status" element={<TranslationStatus/>}/>
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark" theme={theme}>
                <Router>
                    <MainLayout/>
                </Router>
            </MantineProvider>
        </QueryClientProvider>
    );
}

export default App;
