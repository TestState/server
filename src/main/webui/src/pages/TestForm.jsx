import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { useNavigate, useParams } from '@solidjs/router';
import { ArrowLeft, Copy, Save } from 'lucide-solid';
import { createSignal, createEffect, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';

function TestFormInner(props) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [testType, setTestType] = createSignal('');
    const [payloadIds, setPayloadIds] = createSignal([]);
    const [errorMsg, setErrorMsg] = createSignal(null);

    const saveMutation = createMutation(() => ({
        mutationFn: (body) => {
            const url = props.isEdit ? `/api/tests/${props.id}` : '/api/tests';
            const method = props.isEdit ? 'PUT' : 'POST';
            return safeFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tests-data'] });
            navigate('/tests');
        },
        onError: (err) => {
            setErrorMsg(err.message);
        }
    }));

    const copyMutation = createMutation(() => ({
        mutationFn: () => safeFetch(`/api/tests/${props.id}/copy`, { method: 'POST' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tests-data'] });
            navigate('/tests');
        },
        onError: (err) => {
            alert('Failed to duplicate test: ' + err.message);
        }
    }));

    createEffect(() => {
        const ent = props.entity;
        if (ent) {
            setName(ent.name || '');
            setDescription(ent.description || '');
            setTestType(ent.testType || '');
            setPayloadIds(ent.payloads?.map(p => p.id) || []);
        } else if (props.availableTypes?.length > 0 && !testType()) {
            setTestType(props.availableTypes[0]);
        }
    });

    const getPayloadRequirement = (payloadType) => {
        const tType = testType();
        const ags = props.agents;
        if (!tType || !ags) return null;
        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
        ags.forEach(agent => {
            const test = agent.supportedTests?.find(t => t.testType === tType);
            if (test) {
                test.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
                test.optionalPayloadTypes?.forEach(o => {
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

        if (!name()) {
            setErrorMsg("Name is required");
            return;
        }
        if (!testType()) {
            setErrorMsg("Type is required");
            return;
        }

        saveMutation.mutate({
            name: name(),
            description: description(),
            testType: testType(),
            payloadIds: payloadIds()
        });
    };

    const handleCheck = (payloadId, checked) => {
        if (checked) {
            setPayloadIds(prev => [...prev, payloadId]);
        } else {
            setPayloadIds(prev => prev.filter(val => val !== payloadId));
        }
    };

    return (
        <div class="space-y-6 w-full">
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">{props.isEdit ? 'Edit Test' : 'New Test'}</h1>
                <div class="flex gap-2">
                    <Show when={props.isEdit}>
                        <button
                            class="btn btn-outline btn-sm flex items-center gap-1.5"
                            onClick={() => copyMutation.mutate()}
                            disabled={copyMutation.isPending}
                        >
                            <Show when={copyMutation.isPending}>
                                <span class="loading loading-spinner loading-xs"></span>
                            </Show>
                            <Show when={!copyMutation.isPending}>
                                <Copy size={16} />
                            </Show>
                            <span>Copy</span>
                        </button>
                    </Show>
                    <button 
                        class="btn btn-outline btn-sm flex items-center gap-1.5"
                        onClick={() => navigate('/tests')}
                    >
                        <ArrowLeft size={16} />
                        <span>Return</span>
                    </button>
                </div>
            </div>

            <Show when={errorMsg()}>
                <div class="alert alert-error flex justify-between items-center">
                    <span>{errorMsg()}</span>
                    <button class="btn btn-ghost btn-xs text-error-content" onClick={() => setErrorMsg(null)}>✕</button>
                </div>
            </Show>

            <form onSubmit={handleSubmit} class="space-y-6">
                {/* Settings Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Settings</h2>

                        <div class="form-control w-full">
                            <label class="label">
                                <span class="label-text font-semibold">Name <span class="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter test name"
                                required
                                class="input input-bordered w-full"
                                value={name()}
                                onInput={(e) => setName(e.currentTarget.value)}
                            />
                        </div>

                        <div class="form-control w-full">
                            <label class="label">
                                <span class="label-text font-semibold">Description</span>
                            </label>
                            <textarea
                                placeholder="Enter description"
                                rows="3"
                                class="textarea textarea-bordered w-full"
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                            />
                        </div>

                        <div class="form-control w-full">
                            <label class="label">
                                <span class="label-text font-semibold">Type <span class="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                placeholder="Select or enter test type"
                                required
                                class="input input-bordered w-full"
                                list="available-test-types"
                                value={testType()}
                                onInput={(e) => setTestType(e.currentTarget.value)}
                            />
                            <datalist id="available-test-types">
                                <For each={props.availableTypes}>
                                    {(item) => <option value={item} />}
                                </For>
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Payloads Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Payloads</h2>

                        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            <Show when={props.allPayloads.length === 0}>
                                <div class="text-center py-6 text-sm text-base-content/50">
                                    <span>Empty. </span>
                                    <button class="link link-primary" type="button" onClick={() => navigate('/payloads/new')}>New.</button>
                                </div>
                            </Show>
                            <Show when={props.allPayloads.length > 0}>
                                <div class="space-y-2">
                                    <For each={props.allPayloads}>
                                        {(payload) => {
                                            const reqState = () => getPayloadRequirement(payload.type);
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
                                                            onChange={(e) => handleCheck(payload.id, e.currentTarget.checked)}
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
                    disabled={saveMutation.isPending}
                >
                    <Show when={saveMutation.isPending}>
                        <span class="loading loading-spinner loading-sm"></span>
                    </Show>
                    <Show when={!saveMutation.isPending}>
                        <Save size={18} />
                    </Show>
                    <span>Save</span>
                </button>
            </form>
        </div>
    );
}

export default function TestForm() {
    const params = useParams();
    const isEdit = () => !!params.id;

    const formContextQuery = createQuery(() => ({
        queryKey: ['test-form-context', params.id],
        queryFn: async () => {
            const [types, payloads, entity, agents] = await Promise.all([
                safeFetch('/api/tests/available-types'),
                safeFetch('/api/payloads'),
                isEdit() ? safeFetch(`/api/tests/${params.id}`) : Promise.resolve(null),
                safeFetch('/api/agents')
            ]);
            return { types, payloads, entity, agents };
        }
    }));

    const isLoading = () => formContextQuery.isPending;
    const hasError = () => formContextQuery.error;
    const errorMessage = () => formContextQuery.error?.message || String(formContextQuery.error);

    return (
        <div class="max-w-3xl mx-auto w-full">
            <Title>{isEdit() ? 'Edit' : 'Create'} Test | TestState</Title>
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading Form data...</p>
                </div>
            </Show>

            <Show when={hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError()}>
                <TestFormInner
                    isEdit={isEdit()}
                    id={params.id}
                    availableTypes={formContextQuery.data.types}
                    allPayloads={formContextQuery.data.payloads}
                    entity={formContextQuery.data.entity}
                    agents={formContextQuery.data.agents}
                />
            </Show>
        </div>
    );
}
