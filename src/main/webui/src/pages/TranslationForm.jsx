import { createSignal, createEffect, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';
import { safeFetch } from '../utils/safeFetch';
import { useNavigate } from '@solidjs/router';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { ArrowLeft, Play } from 'lucide-solid';

export default function TranslationForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formError, setFormError] = createSignal(null);

    const [agentId, setAgentId] = createSignal('');
    const [type, setType] = createSignal('');
    const [payloadIds, setPayloadIds] = createSignal([]);

    const agentsQuery = createQuery(() => ({
        queryKey: ['agents'],
        queryFn: () => safeFetch('/api/agents')
    }));

    const payloadsQuery = createQuery(() => ({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads')
    }));

    const mutation = createMutation(() => ({
        mutationFn: (body) => safeFetch('/api/translations/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['translationsSessions'] });
            if (res.sessionId) {
                navigate(`/translations/${res.sessionId}/status`);
            }
        },
        onError: (err) => {
            setFormError(err.message);
        }
    }));

    const agents = () => agentsQuery.data || [];
    const payloads = () => payloadsQuery.data || [];

    const currentAgent = () => agents().find(a => a.id === agentId());
    const currentTranslation = () => currentAgent()?.supportedTranslations?.find(t => t.type === type());
    const allowedSources = () => currentTranslation()?.sourcePayloadTypes || [];

    const filteredPayloads = () => {
        const t = type();
        const pl = payloads();
        const sources = allowedSources();
        return t ? pl.filter(p => sources.includes(p.type)) : pl;
    };

    const handleAgentChange = (value) => {
        setAgentId(value || '');
        setType('');
        setPayloadIds([]);
    };

    const handleTypeChange = (value) => {
        setType(value || '');
        setPayloadIds([]);
    };

    createEffect(() => {
        const t = type();
        const ids = payloadIds();
        const pl = payloads();
        const sources = allowedSources();

        if (t && ids.length > 0) {
            const validIds = ids.filter(id => {
                const p = pl.find(x => x.id === id);
                return p && sources.includes(p.type);
            });
            if (validIds.length !== ids.length) {
                setPayloadIds(validIds);
            }
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const agId = agentId();
        const t = type();
        if (!agId) {
            setFormError('Please select a translation node.');
            return;
        }
        if (!t) {
            setFormError('Please select a translation type.');
            return;
        }
        setFormError(null);
        mutation.mutate({
            agentId: agId,
            type: t,
            payloadIds: payloadIds()
        });
    };

    const handlePayloadCheck = (id, checked) => {
        if (checked) {
            setPayloadIds(prev => [...prev, id]);
        } else {
            setPayloadIds(prev => prev.filter(val => val !== id));
        }
    };

    const isLoading = () => agentsQuery.isPending || payloadsQuery.isPending;
    const error = () => formError() || mutation.error?.message;

    return (
        <div class="max-w-3xl mx-auto w-full space-y-6">
            <Title>Create Translation | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">New Translation</h1>
                <button
                    class="btn btn-outline btn-sm flex items-center gap-1.5"
                    onClick={() => navigate('/translations')}
                >
                    <ArrowLeft size={16} />
                    <span>Cancel</span>
                </button>
            </div>

            <Show when={error()}>
                <div class="alert alert-error flex justify-between items-center">
                    <span>{error()}</span>
                    <button class="btn btn-ghost btn-xs text-error-content" onClick={() => setFormError(null)}>✕</button>
                </div>
            </Show>

            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading translation profiles...</p>
                </div>
            </Show>

            <Show when={!isLoading()}>
                <form onSubmit={handleSubmit} class="space-y-6">
                    {/* Task Card */}
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Task</h2>

                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold">Node <span class="text-error">*</span></span>
                                </label>
                                <select 
                                    class="select select-bordered w-full"
                                    value={agentId()}
                                    onChange={(e) => handleAgentChange(e.currentTarget.value)}
                                >
                                    <option value="" disabled selected>Select translation node</option>
                                    <For each={agents()}>
                                        {(agent) => <option value={agent.id}>{agent.name}</option>}
                                    </For>
                                </select>
                            </div>

                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold">Type <span class="text-error">*</span></span>
                                </label>
                                <select 
                                    class="select select-bordered w-full"
                                    disabled={!agentId()}
                                    value={type()}
                                    onChange={(e) => handleTypeChange(e.currentTarget.value)}
                                >
                                    <option value="" disabled selected>
                                        {agentId() ? "Select translation format type" : "Select node first"}
                                    </option>
                                    <For each={currentAgent()?.supportedTranslations || []}>
                                        {(trans) => <option value={trans.type}>{trans.type}</option>}
                                    </For>
                                </select>
                            </div>

                            <Show when={currentTranslation()}>
                                <div class="flex items-center gap-2 font-mono text-xs mt-2">
                                    <span class="badge badge-accent badge-sm">{allowedSources().join(', ')}</span>
                                    <span>&rarr;</span>
                                    <span class="badge badge-secondary badge-sm">{currentTranslation().targetPayloadTypes?.join(', ')}</span>
                                </div>
                            </Show>
                        </div>
                    </div>

                    {/* Payloads Card */}
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Payloads</h2>
                            <div class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                <Show when={filteredPayloads().length === 0}>
                                    <p class="text-center text-sm text-base-content/50 py-4">No compatible payloads.</p>
                                </Show>
                                <Show when={filteredPayloads().length > 0}>
                                    <div class="space-y-2">
                                        <For each={filteredPayloads()}>
                                            {(payload) => {
                                                const isChecked = () => payloadIds().includes(payload.id);
                                                return (
                                                    <div 
                                                        class={`flex items-center justify-between p-3 rounded-lg border border-base-200 transition-colors ${
                                                            isChecked() ? 'bg-primary/5 border-primary/20' : 'bg-base-300/40'
                                                        }`}
                                                    >
                                                        <label class="label cursor-pointer flex justify-start items-center gap-3 w-full">
                                                            <input 
                                                                type="checkbox" 
                                                                class="checkbox checkbox-primary checkbox-sm"
                                                                checked={isChecked()}
                                                                onChange={(e) => handlePayloadCheck(payload.id, e.currentTarget.checked)}
                                                            />
                                                            <div class="flex flex-col">
                                                                <span class="font-semibold text-sm">{payload.name}</span>
                                                                <span class="font-mono text-xs text-base-content/50">{payload.type}</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            }}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary w-full flex items-center gap-2"
                        disabled={!type() || mutation.isPending}
                    >
                        <Show when={mutation.isPending}>
                            <span class="loading loading-spinner loading-sm"></span>
                        </Show>
                        <Show when={!mutation.isPending}>
                            <Play size={18} />
                        </Show>
                        <span>Start Translation</span>
                    </button>
                </form>
            </Show>
        </div>
    );
}
