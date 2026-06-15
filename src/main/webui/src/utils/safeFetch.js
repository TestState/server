/**
 * Safe fetch utility that wraps standard fetch calls,
 * automatically handles JSON responses, multipart uploads, and error reporting.
 */
export async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);

        // Check if the response is an attachment/blob download
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition && (contentDisposition.includes('attachment') || contentDisposition.includes('filename'))) {
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }
            return response.blob();
        }

        // Parse JSON
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = {text};
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `API request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`safeFetch error on ${url}:`, error);
        throw error;
    }
}
