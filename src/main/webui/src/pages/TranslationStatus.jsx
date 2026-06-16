import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getStatusColor } from '../utils/format';
import { useNavigate, useParams } from '@solidjs/router';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { ArrowLeft, Check, Save, Download } from 'lucide-solid';

function SavePayloadForm(props) {
    const [name, setName] = createSignal(`Translated: ${props.item.name || props.item.type}`);
    const [description, setDescription] = createSignal(`Translated ${props.item.type} from session ${props.sessionId}`);

    const mutation = createMutation(() => ({
        mutationFn: (body) => safeFetch(`/api/translations/sessions/${props.sessionId}/payloads/${props.item.index}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: () => {
            props.onSaveSuccess();
        },
        onError: (err) => {
            alert('Failed to save payload: ' + err.message);
        }
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const n = name();
        if (!n) return;
        mutation.mutate({
            name: n,
            description: description()
        });
    };

    return (
        <form onSubmit={handleSubmit} class="mt-4 pt-4 border-t border-base-200 space-y-3">
            <span class="text-xs text-base-content/50 block font-semibold">Save as database payload:</span>
            <div class="form-control w-full">
                <input
                    type="text"
                    placeholder="Name"
                    required
                    class="input input-bordered input-sm w-full"
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                />
            </div>
            <div class="form-control w-full">
                <input
                    type="text"
                    placeholder="Description"
                    class="input input-bordered input-sm w-full"
                    value={description()}
                    onInput={(e) => setDescription(e.currentTarget.value)}
                />
            </div>
            <div class="flex justify-end">
                <button
                    type="submit"
                    class="btn btn-primary btn-xs flex items-center gap-1"
                    disabled={mutation.isPending}
                >
                    <Show when={mutation.isPending}>
                        <span class="loading loading-spinner loading-xs"></span>
                    </Show>
                    <Show when={!mutation.isPending}>
                        <Save size={12} />
                    </Show>
                    <span>Save</span>
                </button>
            </div>
        </form>
    );
}

export default function TranslationStatus() {
    const params = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [telemetryLogs, setTelemetryLogs] = createSignal([]);
    let logsEndRef;

    const sessionQuery = createQuery(() => ({
        queryKey: ['translationSession', params.sessionId],
        queryFn: () => safeFetch(`/api/translations/sessions/${params.sessionId}`)
    }));

    createEffect(() => {
        const sess = session();
        if (!sess || sess.terminal) return;

        let active = true;
        let ws;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/telemetry/translation/${params.sessionId}`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'STATUS') {
                    queryClient.setQueryData(['translationSession', params.sessionId], (prev) => {
                        return prev ? { ...prev, status: msg.state, statusMessage: msg.message } : null;
                    });
                } else if (msg.type === 'RESULT') {
                    const items = msg.result.map(item => ({
                        index: item.index,
                        name: item.name,
                        type: item.type,
                        databaseId: null
                    }));
                    queryClient.setQueryData(['translationSession', params.sessionId], (prev) => {
                        return prev ? { ...prev, generatedItems: items } : null;
                    });
                } else if (msg.type === 'TELEMETRY') {
                    setTelemetryLogs(prev => [...prev, msg]);
                }
            } catch (e) {
                console.error("Failed to parse WS message", e);
            }
        };

        ws.onerror = (err) => {
            console.warn("WebSocket encountered error", err);
        };

        onCleanup(() => {
            active = false;
            if (ws) ws.close();
        });
    });

    createEffect(() => {
        telemetryLogs();
        if (logsEndRef) {
            logsEndRef.scrollIntoView({ behavior: 'smooth' });
        }
    });

    const handleSaveSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['translationSession', params.sessionId] });
    };

    const session = () => sessionQuery.data;
    const isLoading = () => sessionQuery.isPending;
    const hasError = () => sessionQuery.error;
    const errorMessage = () => sessionQuery.error?.message || String(sessionQuery.error);

    const hasResult = () => session()?.generatedItems && session().generatedItems.length > 0;

    return (
        <div class="space-y-6 w-full">
            <Title>Translation {params.sessionId} Status | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <div class="space-y-0.5">
                    <h1 class="text-2xl font-bold">Translation Status</h1>
                    <p class="font-mono text-xs text-base-content/50">{params.sessionId}</p>
                </div>
                <button
                    class="btn btn-outline btn-sm flex items-center gap-1.5"
                    onClick={() => navigate('/translations')}
                >
                    <ArrowLeft size={16} />
                    <span>Return</span>
                </button>
            </div>

            {/* Content states */}
            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Waiting...</p>
                </div>
            </Show>

            <Show when={!isLoading() && hasError()}>
                <div class="alert alert-error">
                    <span>Error: {errorMessage()}</span>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError() && !session()}>
                <div class="alert alert-error flex flex-col items-start gap-4">
                    <span>Session not found.</span>
                    <button class="btn btn-sm" onClick={() => navigate('/translations')}>
                        Back to Translations
                    </button>
                </div>
            </Show>

            <Show when={!isLoading() && !hasError() && session()}>
                {/* Progress Section */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <div class="flex justify-between items-center border-b border-base-200 pb-2">
                            <h2 class="card-title text-base font-semibold">Progress</h2>
                            <span class={`badge ${getStatusColor(session().status)}`}>
                                {getCleanStatus(session().status)}
                            </span>
                        </div>
                        <div class="space-y-1">
                            <span class="text-xs text-base-content/50 block">Status Message</span>
                            <p class="font-semibold text-sm">
                                {session().statusMessage || 'Awaiting agent translation...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Result Section */}
                <Show when={hasResult()}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Result</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <For each={session().generatedItems}>
                                    {(item) => {
                                        const dbId = () => item.databaseId;
                                        const isSaved = () => !!dbId();
                                        return (
                                            <div class="card bg-base-300 border border-base-200 p-4 flex flex-col justify-between">
                                                <div class="flex justify-between items-start gap-4 mb-3">
                                                    <div class="min-w-0 flex-1">
                                                        <h3 class="font-semibold text-sm truncate" title={item.name || item.type}>
                                                            {item.name || item.type}
                                                        </h3>
                                                        <p class="font-mono text-xs text-base-content/50 mt-0.5">{item.type}</p>
                                                    </div>
                                                    <a
                                                        href={`/api/translations/sessions/${params.sessionId}/payloads/${item.index}/download`}
                                                        class="btn btn-xs btn-outline flex items-center gap-1"
                                                        download
                                                    >
                                                        <Download size={12} />
                                                        <span>Download</span>
                                                    </a>
                                                </div>

                                                <Show when={isSaved()}>
                                                    <div class="alert alert-success py-2 text-xs flex items-center gap-2 mt-2">
                                                        <Check size={14} />
                                                        <span>Saved in Database (ID: {dbId()})</span>
                                                    </div>
                                                </Show>

                                                <Show when={!isSaved()}>
                                                    <SavePayloadForm
                                                        sessionId={params.sessionId}
                                                        item={item}
                                                        onSaveSuccess={handleSaveSuccess}
                                                    />
                                                </Show>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Logs Section */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-3">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Logs</h2>
                        <div class="bg-black p-4 rounded-lg border border-base-200 max-h-[250px] overflow-y-auto font-mono text-xs">
                            <Show when={telemetryLogs().length === 0}>
                                <div class="text-base-content/30 italic">Awaiting telemetry logs...</div>
                            </Show>
                            <Show when={telemetryLogs().length > 0}>
                                <For each={telemetryLogs()}>
                                    {(log) => {
                                        let logColor = 'text-success'; // Info color
                                        if (log.level === 'ERROR') logColor = 'text-error';
                                        else if (log.level === 'WARNING') logColor = 'text-warning';
                                        return (
                                            <div class={`${logColor} mb-1`}>
                                                [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level}] {log.message}
                                            </div>
                                        );
                                    }}
                                </For>
                            </Show>
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
