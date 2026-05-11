document.addEventListener('DOMContentLoaded', () => {
    const sid = window.sessionId;
    if (!sid) return;

    const log = window.initLogger('telemetry-console');

    const render = (s) => {
        const t = el('step-template').content.cloneNode(true);
        const card = t.querySelector('article');
        const st = (s.status || 'PENDING').toLowerCase().replace('step_status_', '');
        
        const badge = t.querySelector('.status');
        badge.textContent = st;
        badge.className = 'status status-' + st;
        
        t.querySelector('.step-name').textContent = s.name || 'Unnamed Step';
        t.querySelector('.duration').textContent = (s.summary?.totalDuration || 0) + 'ms';
        
        if (s.message) {
            t.querySelector('.status-message').textContent = s.message;
        } else {
            t.querySelector('.status-message').classList.add('d-none');
        }

        const metadata = s.summary?.metadata || {};
        if (Object.keys(metadata).length > 0) {
            t.querySelector('.metadata-pre').textContent = JSON.stringify(metadata, null, 2);
            t.querySelector('.metadata-pre').classList.remove('d-none');
        } else {
            t.querySelector('.metadata-pre').classList.add('d-none');
        }
        
        const stepAttachments = s.attachments || [];
        const attContainer = t.querySelector('.attachments');
        if (stepAttachments.length > 0) {
            stepAttachments.forEach(a => {
                const at = el('attachment-template').content.cloneNode(true);
                at.querySelector('.attachment-name').textContent = a.name || 'file';
                const dl = at.querySelector('.download-link');
                dl.href = a.url;
                dl.download = a.name || 'file';
                if (a.mimeType?.startsWith('image/')) {
                    const img = at.querySelector('.attachment-img');
                    img.src = a.url;
                    img.classList.remove('d-none');
                }
                attContainer.appendChild(at);
            });
        } else {
            attContainer.classList.add('d-none');
        }

        t.querySelector('.step-header').onclick = () => card.querySelector('.details').classList.toggle('d-none');

        const subSteps = s.steps || s.reports || [];
        if (subSteps.length > 0) {
            const nestedTmpl = el('nested-steps-template').content.cloneNode(true);
            const nestedContainer = nestedTmpl.querySelector('.nested-steps');
            
            subSteps.forEach(sub => {
                nestedContainer.appendChild(render(sub));
            });
            
            card.querySelector('.details').appendChild(nestedContainer);
            card.querySelector('.details').classList.remove('d-none'); // Show by default if has sub-steps
        }

        return t;
    };

    const ws = new WebSocket(window.getWsUrl('/telemetry/test/' + sid));
    ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'TELEMETRY') log(d);
        if (d.type === 'STATUS') {
            const b = el('status-badge');
            if (b) {
                const s = window.formatStatus(d.state, 'TEST_STATE_');
                b.textContent = s.text;
                b.className = 'status status-' + s.class;
            }
            if (el('status-message')) el('status-message').textContent = d.message;
        }
        if (d.type === 'RESULT' && el('steps-container')) {
            el('steps-container').textContent = '';
            (d.result.reports || []).forEach(r => el('steps-container').appendChild(render(r)));
            
            const sumSection = el('summary-section');
            if (sumSection && d.result.summary) {
                sumSection.classList.remove('d-none');
                el('summary-duration').textContent = d.result.summary.totalDuration + 'ms';
                el('summary-json').textContent = JSON.stringify(d.result.summary.metadata || {}, null, 2);
            }

            const attSection = el('attachments-section');
            const attContainer = el('attachments-container');
            if (attSection && attContainer && d.result.attachments?.length) {
                attSection.classList.remove('d-none');
                attContainer.textContent = '';
                d.result.attachments.forEach(a => {
                    const t = el('attachment-template').content.cloneNode(true);
                    const nameEl = t.querySelector('.attachment-name');
                    const imgEl = t.querySelector('.attachment-img');
                    const dlLink = t.querySelector('.download-link');
                    
                    nameEl.textContent = a.name || 'unnamed-file';
                    const url = a.url;
                    dlLink.href = url;
                    dlLink.download = a.name || 'file';

                    if (a.mimeType.startsWith('image/')) {
                        imgEl.src = url;
                        imgEl.classList.remove('d-none');
                        imgEl.onclick = () => window.open(url);
                    }
                    
                    attContainer.appendChild(t);
                });
            }
        }
    };
    ws.onopen = () => log({ level: 'INFO', message: 'Connected.', timestamp: Date.now() });
});
