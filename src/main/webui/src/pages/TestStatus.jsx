import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getDisplayDuration, getStatusColor } from '../utils/format';
import { useNavigate, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { ArrowLeft, ExternalLink, Code, Download } from 'lucide-solid';

function StepCard(props) {
    const status = () => props.step.status || 'PENDING';
    const displayStatus = () => getCleanStatus(status());

    const metadata = () => props.step.summary?.metadata || {};
    const hasMetadata = () => Object.keys(metadata()).length > 0;
    const hasSubSteps = () => props.step.steps && props.step.steps.length > 0;
    const duration = () => props.step.summary?.totalDuration ?? 0;

    return (
        <div class="collapse collapse-arrow bg-base-300 border border-base-200 shadow-sm rounded-lg mb-2">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-bold flex justify-between items-center pr-10">
                <div class="flex items-center gap-2">
                    <span class={`badge badge-sm ${getStatusColor(status())}`}>
                        {displayStatus()}
                    </span>
                    <span>{props.step.name || 'Unnamed Step'}</span>
                </div>
                <span class="font-mono text-xs text-base-content/50">{getDisplayDuration(duration())}</span>
            </div>
            <div class="collapse-content space-y-3">
                <Show when={hasMetadata()}>
                    <pre class="bg-black text-primary p-3 rounded-lg overflow-x-auto text-xs font-mono">
                        {JSON.stringify(metadata(), null, 2)}
                    </pre>
                </Show>
                <Show when={hasSubSteps()}>
                    <div class="pl-3 border-l-2 border-base-200 mt-2 space-y-2">
                        <For each={props.step.steps}>
                            {(subStep, idx) => (
                                <StepCard step={subStep} />
                            )}
                        </For>
                    </div>
                </Show>
            </div>
        </div>
    );
}

export default function TestStatus() {
    const params = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [telemetryLogs, setTelemetryLogs] = createSignal([]);
    let logsEndRef;

    const sessionQuery = createQuery(() => ({
        queryKey: ['testSession', params.sessionId],
        queryFn: () => safeFetch(`/api/tests/sessions/${params.sessionId}`)
    }));

    createEffect(() => {
        const sess = session();
        if (!sess) return;

        // If terminal, load logs from the REST response
        if (sess.terminal) {
            if (sess.logs && sess.logs.length > 0) {
                setTelemetryLogs(sess.logs);
            }
            return;
        }

        let active = true;
        let ws;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/telemetry/test/${params.sessionId}`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'STATUS') {
                    queryClient.setQueryData(['testSession', params.sessionId], prev =>
                        prev ? { ...prev, status: msg.state, statusMessage: msg.message } : null
                    );
                } else if (msg.type === 'RESULT') {
                    queryClient.setQueryData(['testSession', params.sessionId], prev =>
                        prev ? { ...prev, result: msg.result } : null
                    );
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

    const session = () => sessionQuery.data;
    const isLoading = () => sessionQuery.isPending;
    const hasError = () => sessionQuery.error;
    const errorMessage = () => sessionQuery.error?.message || String(sessionQuery.error);

    const getAttachmentDownloadUrl = (index) => {
        return `/api/tests/sessions/${params.sessionId}/attachments/${index}`;
    };

    const hasResult = () => !!session()?.result;
    const resultData = () => session()?.result;
    const reports = () => resultData()?.reports || [];
    const attachments = () => resultData()?.attachments || [];
    const summary = () => resultData()?.summary;

    return (
        <div class="space-y-6 w-full">
            <Title>Session {params.sessionId} Status | TestState</Title>
            {/* Header */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="space-y-0.5">
                    <h1 class="text-2xl font-bold">Session Status</h1>
                    <p class="font-mono text-xs text-base-content/50">{params.sessionId}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <a
                        href={`/api/tests/sessions/${params.sessionId}/report`}
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-outline btn-sm flex items-center gap-1"
                    >
                        <ExternalLink size={14} />
                        <span>Export</span>
                    </a>
                    <a
                        href={`/api/tests/sessions/${params.sessionId}/report?full=true`}
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-outline btn-sm flex items-center gap-1"
                    >
                        <Code size={14} />
                        <span>JSON</span>
                    </a>
                    <button
                        class="btn btn-outline btn-sm flex items-center gap-1.5"
                        onClick={() => navigate('/tests')}
                    >
                        <ArrowLeft size={16} />
                        <span>Return</span>
                    </button>
                </div>
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
                    <button class="btn btn-sm" onClick={() => navigate('/tests')}>
                        Back to Tests
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

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-base-200">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs text-base-content/50">Agent Name</span>
                                <span class="font-semibold">{session().agentName || 'N/A'}</span>
                            </div>
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs text-base-content/50">Agent ID</span>
                                <span class="font-mono text-xs">{session().agentId || 'N/A'}</span>
                            </div>
                            <div class="flex flex-col gap-0.5">
                                <span class="text-xs text-base-content/50">Negotiation Time</span>
                                <span class="font-semibold">{session().negotiationDurationMs ? `${session().negotiationDurationMs} ms` : 'N/A'}</span>
                            </div>
                        </div>

                        <Show when={session().statusMessage}>
                            <div class="alert alert-info py-3 text-sm">
                                <span>{session().statusMessage}</span>
                            </div>
                        </Show>

                        <Show when={reports().length > 0}>
                            <div class="space-y-2 pt-2">
                                <h3 class="font-semibold text-sm">Execution Steps</h3>
                                <div>
                                    <For each={reports()}>
                                        {(report) => (
                                            <StepCard step={report} />
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Summary Section */}
                <Show when={hasResult() && summary()}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Summary</h2>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 text-sm">
                                    <span class="text-base-content/50">Duration:</span>
                                    <span class="font-mono font-semibold">{getDisplayDuration(summary().totalDuration)}</span>
                                </div>
                                <Show when={summary().metadata && Object.keys(summary().metadata).length > 0}>
                                    <pre class="bg-black text-primary p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                        {JSON.stringify(summary().metadata, null, 2)}
                                    </pre>
                                </Show>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Assets Section */}
                <Show when={hasResult() && attachments().length > 0}>
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Assets</h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <For each={attachments()}>
                                    {(attachment, index) => {
                                        const url = getAttachmentDownloadUrl(index());
                                        const isImage = attachment.mimeType?.startsWith('image/');
                                        return (
                                            <div class="card bg-base-300 border border-base-200 p-4 text-center flex flex-col justify-between items-center gap-2">
                                                <div class="w-full text-center">
                                                    <h3 class="font-semibold text-sm truncate w-full" title={attachment.name}>
                                                        {attachment.name}
                                                    </h3>
                                                    <p class="text-xs text-base-content/50 mt-0.5">{attachment.mimeType}</p>
                                                </div>
                                                <Show when={isImage}>
                                                    <div class="w-full h-28 bg-black flex items-center justify-center rounded overflow-hidden mt-1">
                                                        <img
                                                            src={url}
                                                            alt={attachment.name}
                                                            class="max-h-full max-w-full object-contain"
                                                        />
                                                    </div>
                                                </Show>
                                                <a
                                                    href={url}
                                                    download={attachment.name}
                                                    class="btn btn-xs btn-outline flex items-center gap-1.5 w-full mt-2"
                                                >
                                                    <Download size={12} />
                                                    <span>Download</span>
                                                </a>
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
