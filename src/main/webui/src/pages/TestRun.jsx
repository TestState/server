import { createMutation, createQuery } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { useNavigate, useParams } from '@solidjs/router';
import { ArrowLeft, Play } from 'lucide-solid';
import { createSignal, createEffect, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';

function TestRunInner(props) {
    const navigate = useNavigate();

    const [agentIds, setAgentIds] = createSignal([]);
    const [extraPayloadIds, setExtraPayloadIds] = createSignal([]);
    const [iterations, setIterations] = createSignal(1);
    const [strategy, setStrategy] = createSignal('sequential');
    const [errorMsg, setErrorMsg] = createSignal(null);

    const runMutation = createMutation(() => ({
        mutationFn: (body) => safeFetch(`/api/tests/${props.id}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: (res) => {
            if (res.batchId) {
                navigate(`/tests/batch/${res.batchId}/status`);
            } else if (res.sessionId) {
                navigate(`/tests/session/${res.sessionId}/status`);
            }
        },
        onError: (err) => {
            setErrorMsg('Failed to trigger run: ' + err.message);
        }
    }));

    const getPayloadRequirement = (payloadType) => {
        const ags = props.agents;
        const t = props.test;
        if (!ags || !t) return null;
        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
        ags.forEach(agent => {
            if (agentIds().length > 0 && !agentIds().includes(agent.id)) return;

            const st = agent.supportedTests?.find(tt => tt.testType === t.testType);
            if (st) {
                st.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
                st.optionalPayloadTypes?.forEach(o => {
                    if (requirements.get(o) !== 'REQUIRED') {
                        requirements.set(o, 'RECOMMENDED');
                    }
                });
            }
        });
        return requirements.get(payloadType) || null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (agentIds().length === 0) {
            setErrorMsg('Please select at least one agent node.');
            return;
        }

        runMutation.mutate({
            agentIds: agentIds(),
            extraPayloadIds: extraPayloadIds(),
            iterations: parseInt(iterations()) || 1,
            parallel: strategy() === 'parallel'
        });
    };

    const handleAgentCheck = (agentId, checked) => {
        if (checked) {
            setAgentIds(prev => [...prev, agentId]);
        } else {
            setAgentIds(prev => prev.filter(id => id !== agentId));
        }
    };

    const handleExtraCheck = (extraId, checked) => {
        if (checked) {
            setExtraPayloadIds(prev => [...prev, extraId]);
        } else {
            setExtraPayloadIds(prev => prev.filter(id => id !== extraId));
        }
    };

    return (
        <div class="space-y-6 w-full">
            {/* Header */}
            <div class="flex justify-between items-center">
                <div class="space-y-0.5">
                    <h1 class="text-2xl font-bold">New Test Session</h1>
                    <p class="font-mono text-xs text-base-content/50">{props.test.name}</p>
                </div>
                <button
                    class="btn btn-outline btn-sm flex items-center gap-1.5"
                    onClick={() => navigate('/tests')}
                >
                    <ArrowLeft size={16} />
                    <span>Return</span>
                </button>
            </div>

            <Show when={errorMsg()}>
                <div class="alert alert-error flex justify-between items-center">
                    <span>{errorMsg()}</span>
                    <button class="btn btn-ghost btn-xs text-error-content" onClick={() => setErrorMsg(null)}>✕</button>
                </div>
            </Show>

            <form onSubmit={handleSubmit} class="space-y-6">
                {/* Nodes Selection Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Nodes</h2>
                        <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            <Show when={props.agents.length === 0}>
                                <p class="text-center text-sm text-base-content/50 py-4">No active agents.</p>
                            </Show>
                            <Show when={props.agents.length > 0}>
                                <div class="space-y-2">
                                    <For each={props.agents}>
                                        {(agent) => {
                                            const supportsType = () => agent.supportedTestTypes?.includes(props.test.testType);
                                            const isChecked = () => agentIds().includes(agent.id);
                                            return (
                                                <div 
                                                    class={`flex items-center justify-between p-3 rounded-lg border border-base-200 transition-colors ${
                                                        isChecked() ? 'bg-primary/5 border-primary/20' : 'bg-base-300/40'
                                                    }`}
                                                    style={{ opacity: supportsType() ? 1 : 0.5 }}
                                                >
                                                    <label class="label cursor-pointer flex justify-start items-center gap-3 w-full">
                                                        <input 
                                                            type="checkbox" 
                                                            class="checkbox checkbox-primary checkbox-sm"
                                                            disabled={!supportsType()}
                                                            checked={isChecked()}
                                                            onChange={(e) => handleAgentCheck(agent.id, e.currentTarget.checked)}
                                                        />
                                                        <div class="flex flex-col">
                                                            <span class="font-semibold text-sm">{agent.name}</span>
                                                            <span class="font-mono text-xs text-base-content/50">{agent.id}</span>
                                                        </div>
                                                    </label>
                                                    <span class={`badge badge-sm font-bold ${
                                                        supportsType() ? 'badge-success text-success-content' : 'badge-error text-error-content'
                                                    }`}>
                                                        {supportsType() ? 'Ready' : 'Incompatible'}
                                                    </span>
                                                </div>
                                            );
                                        }}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Settings</h2>

                        <div class="form-control w-full">
                            <label class="label">
                                <span class="label-text font-semibold">Iterations</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                required
                                class="input input-bordered w-full"
                                value={iterations()}
                                onInput={(e) => setIterations(parseInt(e.currentTarget.value) || 1)}
                            />
                        </div>

                        <div class="form-control">
                            <label class="label font-semibold">
                                <span class="label-text">Strategy</span>
                            </label>
                            <div class="flex items-center gap-6 mt-1">
                                <label class="label cursor-pointer flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="strategy" 
                                        class="radio radio-primary" 
                                        value="sequential"
                                        checked={strategy() === 'sequential'} 
                                        onChange={() => setStrategy('sequential')}
                                    />
                                    <span class="label-text">Sequential</span>
                                </label>
                                <label class="label cursor-pointer flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="strategy" 
                                        class="radio radio-primary" 
                                        value="parallel"
                                        checked={strategy() === 'parallel'} 
                                        onChange={() => setStrategy('parallel')}
                                    />
                                    <span class="label-text">Parallel</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linked Payloads Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Payloads</h2>
                        <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            <Show when={!props.test.payloads || props.test.payloads.length === 0}>
                                <p class="text-center text-sm text-base-content/50 py-4">No linked payloads.</p>
                            </Show>
                            <Show when={props.test.payloads && props.test.payloads.length > 0}>
                                <div class="divide-y divide-base-200">
                                    <For each={props.test.payloads}>
                                        {(payload) => (
                                            <div class="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                                <span class="font-semibold text-sm">{payload.name}</span>
                                                <span class="badge badge-warning badge-sm font-mono">{payload.type}</span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Extra Payloads Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Extras</h2>
                        <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            <Show when={props.extraPayloads.length === 0}>
                                <p class="text-center text-sm text-base-content/50 py-4">No compatible extras available.</p>
                            </Show>
                            <Show when={props.extraPayloads.length > 0}>
                                <div class="space-y-2">
                                    <For each={props.extraPayloads}>
                                        {(payload) => {
                                            const reqState = () => getPayloadRequirement(payload.type);
                                            const isChecked = () => extraPayloadIds().includes(payload.id);
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
                                                            onChange={(e) => handleExtraCheck(payload.id, e.currentTarget.checked)}
                                                        />
                                                        <div class="flex flex-col">
                                                            <span class="font-semibold text-sm">{payload.name}</span>
                                                            <span class="font-mono text-xs text-base-content/50">{payload.type}</span>
                                                        </div>
                                                    </label>
                                                    <Show when={reqState()}>
                                                        <span class={`badge badge-sm shrink-0 font-bold ${
                                                            reqState() === 'REQUIRED' ? 'badge-error text-error-content' : 'badge-success text-success-content'
                                                        }`}>
                                                            {reqState()}
                                                        </span>
                                                    </Show>
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
                    disabled={runMutation.isPending}
                >
                    <Show when={runMutation.isPending}>
                        <span class="loading loading-spinner loading-sm"></span>
                    </Show>
                    <Show when={!runMutation.isPending}>
                        <Play size={18} />
                    </Show>
                    <span>Start Run</span>
                </button>
            </form>
        </div>
    );
}

export default function TestRun() {
    const params = useParams();

    const runContextQuery = createQuery(() => ({
        queryKey: ['test-run-context', params.id],
        queryFn: async () => {
            const [test, agents, payloads] = await Promise.all([
                safeFetch(`/api/tests/${params.id}`),
                safeFetch('/api/agents'),
                safeFetch('/api/payloads')
            ]);

            const compatibleTypes = new Set();
            agents.forEach(agent => {
                const t = agent.supportedTests?.find(st => st.testType === test.testType);
                if (t) {
                    t.requiredPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
                    t.optionalPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
                }
            });

            const linkedIds = new Set(test.payloads?.map(p => p.id) || []);
            const extraPayloads = payloads.filter(p => !linkedIds.has(p.id) && compatibleTypes.has(p.type));

            return { test, agents, extraPayloads };
        }
    }));

    const isLoading = () => runContextQuery.isPending;
    const hasError = () => runContextQuery.error;
    const errorMessage = () => runContextQuery.error?.message || String(runContextQuery.error);

    return (
        <div class="max-w-3xl mx-auto w-full">
            <Title>Run Test | TestState</Title>
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading Run context...</p>
                </div>
            </Show>

            <Show when={hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                <TestRunInner
                    id={params.id}
                    test={runContextQuery.data.test}
                    agents={runContextQuery.data.agents}
                    extraPayloads={runContextQuery.data.extraPayloads}
                />
            </Show>
        </div>
    );
}
