document.addEventListener('DOMContentLoaded', () => {
    const id = window.batchId,
          table = el('sessions-table'),
          progressContainer = el('batch-progress-container'),
          statusLabel = el('batch-status-label'),
          statTotal = el('stat-total'),
          statPassed = el('stat-passed'),
          statFailed = el('stat-failed'),
          statRunning = el('stat-running'),
          statPending = el('stat-pending'),
          statThroughput = el('stat-throughput'),
          statAvgNegotiate = el('stat-avg-negotiate');

    if (!id) return;

    const ws = new WebSocket(window.getWsUrl('/telemetry/test/batch/' + id));

    ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'BATCH_UPDATE') {
            if (statusLabel) statusLabel.textContent = d.status;
            if (statTotal) statTotal.textContent = d.totalIterations;
            if (statPassed) statPassed.textContent = d.passedCount;
            if (statFailed) statFailed.textContent = d.failedCount;
            if (statRunning) statRunning.textContent = d.runningCount;
            if (statPending) statPending.textContent = d.pendingCount;
            if (statThroughput) statThroughput.textContent = d.throughput + '/m';
            if (statAvgNegotiate) statAvgNegotiate.textContent = d.avgNegotiate + 'ms';

            if (progressContainer) {
                const passed = progressContainer.querySelector('.progress-passed');
                const failed = progressContainer.querySelector('.progress-failed');
                const running = progressContainer.querySelector('.progress-running');
                const pending = progressContainer.querySelector('.progress-pending');

                if (passed) {
                    passed.style.flex = d.passedCount;
                    passed.title = 'Passed: ' + d.passedCount;
                }
                if (failed) {
                    failed.style.flex = d.failedCount;
                    failed.title = 'Failed: ' + d.failedCount;
                }
                if (running) {
                    running.style.flex = d.runningCount;
                    running.title = 'Running: ' + d.runningCount;
                }
                if (pending) {
                    pending.style.flex = d.pendingCount;
                }
            }

            if (table && d.sessions) {
                const empty = el('empty-row');
                if (empty) empty.remove();

                d.sessions.forEach((s) => {
                    let row = table.querySelector('[data-session-id="' + s.sessionId + '"]');
                    if (!row) {
                        const template = el('session-row-template');
                        const clone = template.content.cloneNode(true);
                        row = clone.querySelector('.data-grid-row');
                        row.dataset.sessionId = s.sessionId;

                        row.querySelector('.agent-name').textContent = s.agentName;
                        row.querySelector('.session-id').textContent = s.sessionId;
                        row.querySelector('.view-btn').href = `/tests/${s.sessionId}/status`;

                        table.appendChild(clone);
                    }

                    const badge = row.querySelector('.status');
                    const cleanStatus = s.state.replace('TEST_STATE_', '');
                    badge.textContent = cleanStatus;
                    badge.className = 'status status-' + cleanStatus.toLowerCase();

                    const msgEl = row.querySelector('.status-message');
                    if (msgEl) msgEl.textContent = s.message || '';
                    
                    const negEl = row.querySelector('.negotiation span');
                    if (negEl) {
                        negEl.textContent = s.negotiationDurationMs > 0 ? (s.negotiationDurationMs + 'ms') : '-';
                    }
                });
            }
        }
    };

    ws.onopen = () => console.log('Connected to batch telemetry');
    ws.onclose = () => console.log('Disconnected from batch telemetry');
});
