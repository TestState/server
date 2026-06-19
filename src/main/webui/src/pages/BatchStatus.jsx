import { createSignal, createEffect, onCleanup, Show, For, Index } from 'solid-js';
import { Title } from '@solidjs/meta';
import { safeFetch } from '../utils/safeFetch';
import { getCleanStatus, getStatusColor } from '../utils/format';
import { useNavigate, useParams } from '@solidjs/router';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { ArrowLeft, Download, Code, XCircle } from 'lucide-solid';

export default function BatchStatus() {
    const params = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const batchQuery = createQuery(() => ({
        queryKey: ['batch', params.batchId],
        queryFn: () => safeFetch(`/api/tests/batches/${params.batchId}`)
    }));

    const cancelMutation = createMutation(() => ({
        mutationFn: () => safeFetch(`/api/tests/batches/${params.batchId}/cancel`, { method: 'POST' }),
        onSuccess: () => {
            alert('Batch execution stop request sent');
            queryClient.invalidateQueries({ queryKey: ['batch', params.batchId] });
        },
        onError: (err) => {
            alert('Failed to cancel batch: ' + err.message);
        }
    }));

    let ws = null;
    let isConnectingOrConnected = false;

    createEffect(() => {
        const b = batch();
        if (!b) return;

        // If terminal, and we haven't connected, we don't need WebSocket
        if (b.terminal && !isConnectingOrConnected) {
            return;
        }

        // If not terminal, and not connected yet, open the WebSocket
        if (!b.terminal && !isConnectingOrConnected) {
            isConnectingOrConnected = true;

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            ws = new WebSocket(`${protocol}//${host}/telemetry/test/batch/${params.batchId}`);

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'BATCH_UPDATE') {
                        queryClient.setQueryData(['batch', params.batchId], {
                            batchId: msg.batchId,
                            status: msg.status,
                            completed: msg.completed,
                            iterations: msg.totalIterations,
                            passedCount: msg.passedCount,
                            failedCount: msg.failedCount,
                            runningCount: msg.runningCount,
                            pendingCount: msg.pendingCount,
                            throughput: parseFloat(msg.throughput) || 0,
                            averageNegotiationDuration: parseFloat(msg.avgNegotiate) || 0,
                            sessions: msg.sessions?.map(s => ({
                                id: s.sessionId,
                                sessionId: s.sessionId,
                                status: s.state,
                                message: s.message,
                                agentId: s.agentId,
                                agentName: s.agentName,
                                negotiationDurationMs: s.negotiationDurationMs,
                                terminal: s.terminal
                            })) || []
                        });
                        
                        if (msg.terminal) {
                            queryClient.invalidateQueries({ queryKey: ['batch', params.batchId] });
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse WS message", e);
                }
            };

            ws.onerror = (err) => {
                console.warn("WebSocket encountered error", err);
            };
        }

        // Close WebSocket if batch transitions to terminal during our watch
        if (b.terminal && ws) {
            ws.close();
            ws = null;
        }
    });

    onCleanup(() => {
        if (ws) {
            ws.close();
            ws = null;
        }
        isConnectingOrConnected = false;
    });

    const batch = () => batchQuery.data;
    const isLoading = () => batchQuery.isPending;
    const hasError = () => batchQuery.error;
    const errorMessage = () => batchQuery.error?.message || String(batchQuery.error);

    const cancelling = () => cancelMutation.isPending;
    const isCancelable = () => batch() && (batch().status === 'PENDING' || batch().status === 'RUNNING');

    const sessions = () => batch()?.sessions || [];
    const total = () => batch()?.iterations || 0;
    const passed = () => batch()?.passedCount !== undefined ? batch().passedCount : sessions().filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length;
    const failed = () => batch()?.failedCount !== undefined ? batch().failedCount : sessions().filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length;
    const running = () => batch()?.runningCount !== undefined ? batch().runningCount : sessions().filter(s => s.status?.includes('RUNNING')).length;
    const pending = () => batch()?.pendingCount !== undefined ? batch().pendingCount : Math.max(0, total() - (passed() + failed()) - running());

    const rate = () => {
        const r = batch()?.throughput;
        return typeof r === 'number' ? r.toFixed(2) : r || '0.00';
    };
    const time = () => {
        const t = batch()?.averageNegotiationDuration;
        return typeof t === 'number' ? t.toFixed(2) : t || '0.00';
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to stop this batch run?')) {
            cancelMutation.mutate();
        }
    };

    return (
        <div class="space-y-6 w-full">
            <Title>Batch {params.batchId} Status | TestState</Title>
            {/* Header */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="space-y-0.5">
                    <h1 class="text-2xl font-bold">Batch Status</h1>
                    <p class="font-mono text-xs text-base-content/50">{params.batchId}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <a
                        href={`/api/tests/batches/${params.batchId}/report`}
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-outline btn-sm flex items-center gap-1"
                    >
                        <Download size={14} />
                        <span>Export</span>
                    </a>
                    <a
                        href={`/api/tests/batches/${params.batchId}/report?full=true`}
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-outline btn-sm flex items-center gap-1"
                    >
                        <Code size={14} />
                        <span>JSON</span>
                    </a>
                    <Show when={isCancelable()}>
                        <button
                            class="btn btn-error btn-sm text-error-content flex items-center gap-1"
                            onClick={handleCancel}
                            disabled={cancelling()}
                        >
                            <Show when={cancelling()}>
                                <span class="loading loading-spinner loading-xs"></span>
                            </Show>
                            <Show when={!cancelling()}>
                                <XCircle size={14} />
                            </Show>
                            <span>Stop</span>
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

            <Show when={!isLoading() && !hasError() && batch()}>
                {/* Progress Card */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5 space-y-4">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">Progress</h2>

                        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-base-content/50">Status</span>
                                <div class="flex justify-center mt-1">
                                    <span class={`badge badge-sm ${getStatusColor(batch().status)}`}>
                                        {getCleanStatus(batch().status)}
                                    </span>
                                </div>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-base-content/50">Total</span>
                                <span class="font-bold text-md mt-1">{total()}</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-success">Passed</span>
                                <span class="font-bold text-md mt-1 text-success">{passed()}</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-error">Failed</span>
                                <span class="font-bold text-md mt-1 text-error">{failed()}</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-warning">Running</span>
                                <span class="font-bold text-md mt-1 text-warning">{running()}</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-base-content/50">Pending</span>
                                <span class="font-bold text-md mt-1">{pending()}</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-base-content/50">Rate</span>
                                <span class="font-bold text-md mt-1">{rate()}/m</span>
                            </div>
                            <div class="card bg-base-300 border border-base-200 p-3 text-center">
                                <span class="text-xs uppercase font-bold text-base-content/50">Time</span>
                                <span class="font-bold text-md mt-1">{time()}ms</span>
                            </div>
                        </div>

                        <Show when={total() > 0}>
                            <div class="w-full h-3.5 bg-base-300 rounded-full overflow-hidden flex mt-4 border border-base-200 shadow-inner">
                                <Show when={passed() > 0}>
                                    <div style={{ width: `${(passed() / total()) * 100}%` }} class="bg-success h-full" title={`Passed: ${passed()}`} />
                                </Show>
                                <Show when={failed() > 0}>
                                    <div style={{ width: `${(failed() / total()) * 100}%` }} class="bg-error h-full" title={`Failed: ${failed()}`} />
                                </Show>
                                <Show when={running() > 0}>
                                    <div style={{ width: `${(running() / total()) * 100}%` }} class="bg-warning h-full" title={`Running: ${running()}`} />
                                </Show>
                                <Show when={pending() > 0}>
                                    <div style={{ width: `${(pending() / total()) * 100}%` }} class="bg-base-content/20 h-full" title={`Pending: ${pending()}`} />
                                </Show>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Sessions Grid */}
                <div class="card bg-base-100 border border-base-200 shadow-sm">
                    <div class="card-body p-5">
                        <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2 mb-4">Sessions</h2>
                        <Show when={sessions().length === 0}>
                            <p class="text-center text-sm text-base-content/50 py-4">No sessions active for this batch.</p>
                        </Show>
                        <Show when={sessions().length > 0}>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Index each={sessions()}>
                                    {(sessionAccessor) => (
                                        <div class="card bg-base-300 border border-base-200 p-4 flex flex-col justify-between min-h-[140px]">
                                            <div class="space-y-2 flex-grow">
                                                <div class="flex justify-between items-start gap-4">
                                                    <h3 class="font-semibold text-sm truncate" title={sessionAccessor().agentName}>{sessionAccessor().agentName}</h3>
                                                    <span class="font-mono text-xs text-base-content/50 truncate shrink-0" title={sessionAccessor().sessionId}>
                                                        {sessionAccessor().sessionId.slice(0, 8)}...
                                                    </span>
                                                </div>
                                                <div class="flex flex-wrap gap-1.5">
                                                    <span class={`badge badge-sm ${getStatusColor(sessionAccessor().status)}`}>
                                                        {getCleanStatus(sessionAccessor().status)}
                                                    </span>
                                                    <Show when={sessionAccessor().negotiationDurationMs > 0}>
                                                        <span class="badge badge-neutral badge-sm">
                                                            {sessionAccessor().negotiationDurationMs}ms
                                                        </span>
                                                    </Show>
                                                </div>
                                                <Show when={sessionAccessor().message}>
                                                    <p class="text-xs text-base-content/60 line-clamp-2" title={sessionAccessor().message}>
                                                        {sessionAccessor().message}
                                                    </p>
                                                </Show>
                                            </div>
                                            <div class="h-[1px] bg-base-200 my-2" />
                                            <div class="flex justify-end">
                                                <button 
                                                    class="btn btn-ghost btn-xs text-primary"
                                                    onClick={() => navigate(`/tests/session/${sessionAccessor().sessionId}/status`)}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Index>
                            </div>
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
}
