import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { useNavigate } from '@solidjs/router';
import { Plus, Download, Edit, Trash } from 'lucide-solid';
import { Show, For, createEffect } from 'solid-js';
import { Title } from '@solidjs/meta';

export default function Payloads() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const payloadsQuery = createQuery(() => ({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads').then(res => {
            if (!Array.isArray(res)) {
                throw new Error("API returned invalid data format");
            }
            return res;
        })
    }));

    const deleteMutation = createMutation(() => ({
        mutationFn: (id) => safeFetch(`/api/payloads/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            alert('Payload deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['payloads'] });
        },
        onError: (err) => {
            alert('Failed to delete payload: ' + err.message);
        }
    }));

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this payload?')) {
            deleteMutation.mutate(id);
        }
    };

    const payloads = () => payloadsQuery.data || [];
    const isLoading = () => payloadsQuery.isPending;
    const hasError = () => payloadsQuery.error;
    const errorMessage = () => payloadsQuery.error?.message || String(payloadsQuery.error);

    return (
        <div class="space-y-6 w-full">
            <Title>Payloads | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">Payloads</h1>
                <button 
                    class="btn btn-primary btn-sm flex items-center gap-1.5" 
                    onClick={() => navigate('/payloads/new')}
                >
                    <Plus size={16} />
                    <span>New</span>
                </button>
            </div>

            {/* Content states */}
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading payloads...</p>
                </div>
            </Show>

            <Show when={!isLoading() && hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                {/* Payloads Grid */}
                <Show when={payloads().length === 0}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm p-8 text-center space-y-3">
                        <p class="text-base-content/60 text-sm">No payloads configured.</p>
                        <div class="flex justify-center">
                            <button class="btn btn-ghost btn-sm text-primary" onClick={() => navigate('/payloads/new')}>
                                Create New
                            </button>
                        </div>
                    </div>
                </Show>

                <Show when={payloads().length > 0}>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <For each={payloads()}>
                            {(payload) => (
                                <div class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div class="card-body p-5 gap-3 flex-grow">
                                        <div class="flex justify-between items-start gap-4">
                                            <h2 class="card-title text-base font-bold truncate" title={payload.name}>
                                                {payload.name}
                                            </h2>
                                            <span class="badge badge-warning badge-sm font-mono shrink-0">
                                                {payload.type}
                                            </span>
                                        </div>
                                        <Show when={payload.description}>
                                            <p class="text-xs text-base-content/60 line-clamp-3 flex-grow">
                                                {payload.description}
                                            </p>
                                        </Show>
                                    </div>
                                    <div class="px-5 pb-5">
                                        <div class="h-[1px] bg-base-200 mb-4" />
                                        <div class="flex justify-end items-center gap-2">
                                            <Show when={payload.attachmentName}>
                                                <a
                                                    href={`/api/payloads/${payload.id}/attachment`}
                                                    class="btn btn-xs btn-outline flex items-center gap-1"
                                                    title={`Export: ${payload.attachmentName}`}
                                                    download
                                                >
                                                    <Download size={12} />
                                                    <span>Export</span>
                                                </a>
                                            </Show>
                                            <button
                                                class="btn btn-xs btn-info flex items-center gap-1"
                                                onClick={() => navigate(`/payloads/${payload.id}/edit`)}
                                            >
                                                <Edit size={12} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                class="btn btn-xs btn-error flex items-center gap-1"
                                                onClick={() => handleDelete(payload.id)}
                                                disabled={deleteMutation.isPending && deleteMutation.variables === payload.id}
                                            >
                                                <Show when={deleteMutation.isPending && deleteMutation.variables === payload.id}>
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                </Show>
                                                <Show when={!(deleteMutation.isPending && deleteMutation.variables === payload.id)}>
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
            </Show>
        </div>
    );
}
