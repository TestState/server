import { createQuery } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getStatusColor } from '../utils/format';
import { useNavigate } from '@solidjs/router';
import { Plus } from 'lucide-solid';
import { Show, For, createEffect } from 'solid-js';
import { Title } from '@solidjs/meta';

export default function Translations() {
    const navigate = useNavigate();

    const sessionsQuery = createQuery(() => ({
        queryKey: ['translationsSessions'],
        queryFn: () => safeFetch('/api/translations/sessions').then(res => {
            if (!Array.isArray(res)) {
                throw new Error("API returned invalid data format");
            }
            return res;
        })
    }));

    const sessions = () => sessionsQuery.data || [];
    const isLoading = () => sessionsQuery.isPending;
    const hasError = () => sessionsQuery.error;
    const errorMessage = () => sessionsQuery.error?.message || String(sessionsQuery.error);

    return (
        <div class="space-y-6 w-full">
            <Title>Translations | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">Translations</h1>
                <button 
                    class="btn btn-primary btn-sm flex items-center gap-1.5" 
                    onClick={() => navigate('/translations/new')}
                >
                    <Plus size={16} />
                    <span>New</span>
                </button>
            </div>

            {/* Content states */}
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading translation logs...</p>
                </div>
            </Show>

            <Show when={!isLoading() && hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                <Show when={sessions().length === 0}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-8 text-center space-y-3">
                        <p class="text-base-content/60 text-sm">No active translation sessions.</p>
                        <div class="flex justify-center">
                            <button class="btn btn-ghost btn-sm text-primary" onClick={() => navigate('/translations/new')}>
                                Start one
                            </button>
                        </div>
                    </div>
                </Show>

                <Show when={sessions().length > 0}>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <For each={sessions()}>
                            {(session) => (
                                <div class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div class="card-body p-5 gap-3 flex-grow">
                                        <div class="flex justify-between items-center gap-4">
                                            <span class="font-mono text-xs text-base-content/50 truncate flex-grow" title={session.sessionId}>
                                                {session.sessionId}
                                            </span>
                                            <Show when={session.format}>
                                                <span class="badge badge-info badge-sm shrink-0">
                                                    {session.format}
                                                </span>
                                            </Show>
                                        </div>
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class={`badge badge-sm ${getStatusColor(session.status)}`}>
                                                {getCleanStatus(session.status)}
                                            </span>
                                            <Show when={session.statusMessage}>
                                                <span class="text-xs text-base-content/60 truncate" title={session.statusMessage}>
                                                    ({session.statusMessage})
                                                </span>
                                            </Show>
                                        </div>
                                    </div>
                                    <div class="px-5 pb-5">
                                        <div class="h-[1px] bg-base-200 mb-4" />
                                        <div class="flex justify-end">
                                            <button 
                                                class="btn btn-xs btn-outline" 
                                                onClick={() => navigate(`/translations/${session.sessionId}/status`)}
                                            >
                                                Monitor
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </Show>
        </div>
    );
}
