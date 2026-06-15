/**
 * Status color mapping for Mantine Badges based on status string.
 */
export const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s.includes('success')) return 'green';
    if (s.includes('fail') || s.includes('error')) return 'red';
    if (s.includes('run') || s.includes('pending') || s.includes('negotiat')) return 'blue';
    return 'gray';
};

/**
 * Strips verbose gRPC/WebSocket prefixes from status strings.
 */
export const getCleanStatus = (status) => {
    if (!status) return 'PENDING';
    return status
        .replace('TEST_STATE_', '')
        .replace('STEP_STATUS_', '')
        .replace('TRANSLATION_STATE_', '')
        .toUpperCase();
};

/**
 * Normalizes duration values (seconds string or raw milliseconds) to display millisecond strings.
 */
export const getDisplayDuration = (dur) => {
    if (typeof dur === 'string') {
        if (dur.endsWith('s')) {
            const secs = parseFloat(dur);
            if (!isNaN(secs)) {
                return `${Math.round(secs * 1000)}ms`;
            }
            return dur;
        }
        return `${dur}ms`;
    }
    if (typeof dur === 'number') {
        return `${dur}ms`;
    }
    return '0ms';
};
