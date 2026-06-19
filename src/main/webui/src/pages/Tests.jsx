import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getStatusColor } from '../utils/format';
import { useNavigate } from '@solidjs/router';
import { Plus, Play, Copy, Edit, Trash } from 'lucide-solid';
import { Show, For, createEffect } from 'solid-js';
import { Title } from '@solidjs/meta';

export default function Tests() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const testsDataQuery = createQuery(() => ({
        queryKey: ['tests-data'],
        queryFn: async () => {
            const [tests, sessions, batches] = await Promise.all([
                safeFetch('/api/tests'),
                safeFetch('/api/tests/sessions'),
                safeFetch('/api/tests/batches')
            ]);
            return { tests, sessions, batches };
        }
    }));

    const deleteMutation = createMutation(() => ({
        mutationFn: (id) => safeFetch(`/api/tests/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            alert('Test configuration deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['tests-data'] });
        },
        onError: (err) => {
            alert('Failed to delete test: ' + err.message);
        }
    }));

    const copyMutation = createMutation(() => ({
        mutationFn: (id) => safeFetch(`/api/tests/${id}/copy`, { method: 'POST' }),
        onSuccess: () => {
            alert('Test configuration duplicated successfully');
            queryClient.invalidateQueries({ queryKey: ['tests-data'] });
        },
        onError: (err) => {
            alert('Failed to duplicate test: ' + err.message);
        }
    }));

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this test configuration?')) {
            deleteMutation.mutate(id);
        }
    };

    const isLoading = () => testsDataQuery.isPending;
    const hasError = () => testsDataQuery.error;
    const errorMessage = () => testsDataQuery.error?.message || String(testsDataQuery.error);
    const data = () => testsDataQuery.data || { tests: [], sessions: [], batches: [] };

    const hasBatches = () => data().batches && data().batches.length > 0;
    const hasSessions = () => data().sessions && data().sessions.length > 0;

    return (
        <div class="space-y-6 w-full">
            <Title>Tests | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">Tests</h1>
                <button 
                    class="btn btn-primary btn-sm flex items-center gap-1.5" 
                    onClick={() => navigate('/tests/new')}
                >
                    <Plus size={16} />
                    <span>New</span>
                </button>
            </div>

            {/* Content states */}
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading test suites...</p>
                </div>
            </Show>

            <Show when={!isLoading() && hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                {/* Tests Grid */}
                <Show when={(data().tests || []).length === 0}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-8 text-center space-y-3">
                        <p class="text-base-content/60 text-sm">No tests configured.</p>
                        <div class="flex justify-center">
                            <button class="btn btn-ghost btn-sm text-primary" onClick={() => navigate('/tests/new')}>
                                Create New
                            </button>
                        </div>
                    </div>
                </Show>

                <Show when={(data().tests || []).length > 0}>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <For each={data().tests || []}>
                            {(test) => (
                                <div class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div class="card-body p-5 gap-3 flex-grow">
                                        <div class="flex justify-between items-start gap-4">
                                            <h2 class="card-title text-base font-bold truncate" title={test.name}>
                                                {test.name}
                                            </h2>
                                            <span class="badge badge-info badge-sm font-mono shrink-0">
                                                {test.testType}
                                            </span>
                                        </div>
                                        <p class="text-xs text-base-content/50">
                                            {test.payloads?.length || 0} linked
                                        </p>
                                        <Show when={test.description}>
                                            <p class="text-xs text-base-content/60 line-clamp-3 flex-grow">
                                                {test.description}
                                            </p>
                                        </Show>
                                    </div>
                                    <div class="px-5 pb-5">
                                        <div class="h-[1px] bg-base-200 mb-4" />
                                        <div class="flex flex-wrap justify-end items-center gap-2">
                                            <button
                                                class="btn btn-xs btn-primary flex items-center gap-1"
                                                onClick={() => navigate(`/tests/${test.id}/run`)}
                                            >
                                                <Play size={12} />
                                                <span>Run</span>
                                            </button>
                                            <button
                                                class="btn btn-xs btn-outline flex items-center gap-1"
                                                onClick={() => copyMutation.mutate(test.id)}
                                                disabled={copyMutation.isPending && copyMutation.variables === test.id}
                                            >
                                                <Show when={copyMutation.isPending && copyMutation.variables === test.id}>
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                </Show>
                                                <Show when={!(copyMutation.isPending && copyMutation.variables === test.id)}>
                                                    <Copy size={12} />
                                                </Show>
                                                <span>Copy</span>
                                            </button>
                                            <button
                                                class="btn btn-xs btn-info flex items-center gap-1"
                                                onClick={() => navigate(`/tests/${test.id}/edit`)}
                                            >
                                                <Edit size={12} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                class="btn btn-xs btn-error flex items-center gap-1"
                                                onClick={() => handleDelete(test.id)}
                                                disabled={deleteMutation.isPending && deleteMutation.variables === test.id}
                                            >
                                                <Show when={deleteMutation.isPending && deleteMutation.variables === test.id}>
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                </Show>
                                                <Show when={!(deleteMutation.isPending && deleteMutation.variables === test.id)}>
                                                    <Trash size={12} />
                                                </Show>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Batches and Sessions History */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Show when={hasBatches()}>
                        <div class="card bg-base-100 border border-base-200 shadow-sm">
                            <div class="card-body p-4">
                                <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-3">Recent Batches</h2>
                                <div class="divide-y divide-base-200">
                                    <For each={data().batches}>
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
                            </div>
                        </div>
                    </Show>

                    <Show when={hasSessions()}>
                        <div class="card bg-base-100 border border-base-200 shadow-sm">
                            <div class="card-body p-4">
                                <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-3">Recent Sessions</h2>
                                <div class="divide-y divide-base-200">
                                    <For each={data().sessions}>
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
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
