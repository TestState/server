import { createQuery } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getStatusColor } from '../utils/format';
import { useNavigate } from '@solidjs/router';
import { Play, Plus } from 'lucide-solid';
import { Show, For, createEffect } from 'solid-js';
import { Title } from '@solidjs/meta';

export default function Dashboard() {
    const navigate = useNavigate();

    const statsQuery = createQuery(() => ({
        queryKey: ['statistics'],
        queryFn: () => safeFetch('/api/statistics')
    }));

    const agentsQuery = createQuery(() => ({
        queryKey: ['agents'],
        queryFn: () => safeFetch('/api/agents')
    }));

    const sessionsQuery = createQuery(() => ({
        queryKey: ['sessions'],
        queryFn: () => safeFetch('/api/tests/sessions')
    }));

    const batchesQuery = createQuery(() => ({
        queryKey: ['batches'],
        queryFn: () => safeFetch('/api/tests/batches')
    }));

    const testsQuery = createQuery(() => ({
        queryKey: ['tests'],
        queryFn: () => safeFetch('/api/tests')
    }));

    const payloadsQuery = createQuery(() => ({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads')
    }));

    const isLoading = () => statsQuery.isPending || agentsQuery.isPending || sessionsQuery.isPending || batchesQuery.isPending || testsQuery.isPending || payloadsQuery.isPending;
    const hasError = () => statsQuery.error || agentsQuery.error || sessionsQuery.error || batchesQuery.error || testsQuery.error || payloadsQuery.error;
    const errorMessage = () => {
        const err = statsQuery.error || agentsQuery.error || sessionsQuery.error || batchesQuery.error || testsQuery.error || payloadsQuery.error;
        return err ? (err.message || String(err)) : '';
    };

    const agents = () => agentsQuery.data || [];
    const batches = () => batchesQuery.data || [];
    const sessions = () => sessionsQuery.data || [];

    return (
        <div class="space-y-6 w-full">
            <Title>Dashboard | TestState</Title>
            {/* Header */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 class="text-2xl font-bold">Dashboard</h1>
                <div class="flex gap-2">
                    <button
                        class="btn btn-primary btn-sm flex items-center gap-1.5"
                        onClick={() => navigate('/tests/new')}
                    >
                        <Play size={16} />
                        <span>New Test</span>
                    </button>
                    <button
                        class="btn btn-outline btn-primary btn-sm flex items-center gap-1.5"
                        onClick={() => navigate('/payloads/new')}
                    >
                        <Plus size={16} />
                        <span>New Payload</span>
                    </button>
                </div>
            </div>

            {/* Content states */}
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading Dashboard metrics...</p>
                </div>
            </Show>

            <Show when={!isLoading() && hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                {/* Overview Cards */}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Tests</span>
                        <span class="text-2xl font-bold mt-1">{testsQuery.data?.length || 0}</span>
                    </div>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Payloads</span>
                        <span class="text-2xl font-bold mt-1">{payloadsQuery.data?.length || 0}</span>
                    </div>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Nodes</span>
                        <span class="text-2xl font-bold mt-1">{agentsQuery.data?.length || 0}</span>
                    </div>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Sessions</span>
                        <span class="text-2xl font-bold mt-1">{sessionsQuery.data?.length || 0}</span>
                    </div>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Avg Time</span>
                        <span class="text-2xl font-bold mt-1">{Number(statsQuery.data?.avgNegotiationTime ?? 0).toFixed(2)} ms</span>
                    </div>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-4 text-center">
                        <span class="text-xs uppercase font-bold text-base-content/50">Rate</span>
                        <span class="text-2xl font-bold mt-1">{Number(statsQuery.data?.throughput ?? 0).toFixed(2)}/m</span>
                    </div>
                </div>

                {/* Nodes Section */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-3">Nodes</h2>
                        <Show when={agents().length === 0}>
                            <p class="text-center text-sm text-base-content/50 py-4">No active nodes</p>
                        </Show>
                        <Show when={agents().length > 0}>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <For each={agents()}>
                                    {(agent) => (
                                        <div class="card bg-base-300 border border-base-200 p-4 flex flex-col justify-between min-h-[120px]">
                                            <div class="space-y-2">
                                                <div>
                                                    <h3 class="font-semibold text-sm">{agent.name}</h3>
                                                    <p class="font-mono text-xs text-base-content/50 truncate" title={agent.id}>{agent.id}</p>
                                                </div>
                                                <div class="h-[1px] bg-base-200" />
                                                <p class="text-xs font-bold text-base-content/60">Capabilities:</p>
                                                <div class="flex flex-wrap gap-1">
                                                    <For each={agent.capabilities}>
                                                        {(cap) => {
                                                            const isTest = agent.supportedTestTypes?.includes(cap);
                                                            const isTranslation = agent.supportedTranslations?.some(t => t.type === cap);
                                                            let badgeClass = "badge-neutral";
                                                            if (isTest) badgeClass = "badge-info text-info-content";
                                                            else if (isTranslation) badgeClass = "badge-success text-success-content";
                                                            return <span class={`badge badge-sm ${badgeClass}`}>{cap}</span>;
                                                        }}
                                                    </For>
                                                    {(!agent.capabilities || agent.capabilities.length === 0) && (
                                                        <span class="text-xs text-base-content/50">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Batches and Sessions (2-column layout) */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Batches */}
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-3">Recent Batches</h2>
                            <Show when={batches().length === 0}>
                                <p class="text-center text-sm text-base-content/50 py-4">No batches</p>
                            </Show>
                            <Show when={batches().length > 0}>
                                <div class="divide-y divide-base-200">
                                    <For each={batches().slice(0, 8)}>
                                        {(batch) => (
                                            <div class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                                                <div class="min-w-0 flex-1">
                                                    <h3 class="font-semibold text-sm truncate" title={batch.testName}>{batch.testName}</h3>
                                                    <div class="flex items-center gap-2 mt-1">
                                                        <span class="font-mono text-xs text-base-content/50">{batch.batchId}</span>
                                                        <span class={`badge badge-sm ${getStatusColor(batch.status)}`}>
                                                            {getCleanStatus(batch.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    class="btn btn-ghost btn-xs text-primary"
                                                    onClick={() => navigate(`/tests/batch/${batch.batchId}/status`)}
                                                >
                                                    Monitor
                                                </button>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>

                    {/* Sessions */}
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-3">Recent Sessions</h2>
                            <Show when={sessions().length === 0}>
                                <p class="text-center text-sm text-base-content/50 py-4">No sessions</p>
                            </Show>
                            <Show when={sessions().length > 0}>
                                <div class="divide-y divide-base-200">
                                    <For each={sessions().slice(0, 8)}>
                                        {(session) => (
                                            <div class="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                                                <div class="min-w-0 flex-1">
                                                    <h3 class="font-semibold text-sm truncate" title={session.ticket?.testType || session.agentName}>
                                                        {session.ticket?.testType || session.agentName}
                                                    </h3>
                                                    <div class="flex items-center gap-2 mt-1">
                                                        <span class="font-mono text-xs text-base-content/50">{session.sessionId}</span>
                                                        <span class={`badge badge-sm ${getStatusColor(session.status)}`}>
                                                            {getCleanStatus(session.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    class="btn btn-ghost btn-xs text-primary"
                                                    onClick={() => navigate(`/tests/session/${session.sessionId}/status`)}
                                                >
                                                    Inspect
                                                </button>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
