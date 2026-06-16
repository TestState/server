import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { safeFetch } from '../utils/safeFetch';
import { useNavigate, useParams } from '@solidjs/router';
import { ArrowLeft, Save } from 'lucide-solid';
import { createSignal, createEffect, Show, For } from 'solid-js';
import { Title } from '@solidjs/meta';

export default function PayloadForm() {
    const params = useParams();
    const navigate = useNavigate();
    const isEdit = () => !!params.id;
    const queryClient = useQueryClient();

    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [type, setType] = createSignal('');
    const [metadata, setMetadata] = createSignal('');
    const [attachmentFile, setAttachmentFile] = createSignal(null);
    const [errorMsg, setErrorMsg] = createSignal(null);

    // Queries
    const availableTypesQuery = createQuery(() => ({
        queryKey: ['payloadAvailableTypes'],
        queryFn: () => safeFetch('/api/payloads/available-types')
    }));

    const mimeMappingsQuery = createQuery(() => ({
        queryKey: ['payloadMimeMappings'],
        queryFn: () => safeFetch('/api/payloads/mime-mappings')
    }));

    const entityQuery = createQuery(() => ({
        queryKey: ['payload', params.id],
        queryFn: () => safeFetch(`/api/payloads/${params.id}`),
        enabled: isEdit()
    }));

    const saveMutation = createMutation(() => ({
        mutationFn: (payloadForm) => {
            const url = isEdit() ? `/api/payloads/${params.id}` : '/api/payloads';
            const method = isEdit() ? 'PUT' : 'POST';
            return safeFetch(url, {
                method: method,
                body: payloadForm
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payloads'] });
            navigate('/payloads');
        },
        onError: (err) => {
            setErrorMsg(err.message);
        }
    }));

    const availableTypes = () => availableTypesQuery.data || [];
    const mimeMappings = () => mimeMappingsQuery.data || {};
    const entity = () => entityQuery.data;

    createEffect(() => {
        const ent = entity();
        if (ent) {
            setName(ent.name || '');
            setDescription(ent.description || '');
            setType(ent.type || '');
            setMetadata(ent.metadata || '');
        } else if (availableTypes().length > 0 && !type()) {
            setType(availableTypes()[0]);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name()) {
            setErrorMsg("Name is required");
            return;
        }
        if (!type()) {
            setErrorMsg("Type is required");
            return;
        }

        const file = attachmentFile();
        const mappings = mimeMappings();
        const t = type();

        // Validation: check MIME type mapping
        if (file && t && mappings[t]) {
            const allowedMimeTypes = mappings[t];
            if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
                setErrorMsg(`Unsupported file type: ${file.type} for type ${t}. Expected: ${allowedMimeTypes.join(', ')}`);
                return;
            }
        }

        const payloadForm = new FormData();
        payloadForm.append('name', name());
        payloadForm.append('description', description());
        payloadForm.append('type', t);
        payloadForm.append('metadata', metadata());
        if (file) {
            payloadForm.append('attachmentFile', file);
        }

        saveMutation.mutate(payloadForm);
    };

    const isLoading = () => availableTypesQuery.isPending || mimeMappingsQuery.isPending || (isEdit() && entityQuery.isPending);

    return (
        <div class="max-w-3xl mx-auto w-full space-y-6">
            <Title>{isEdit() ? 'Edit' : 'Create'} Payload | TestState</Title>
            {/* Header */}
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">{isEdit() ? 'Edit Payload' : 'New Payload'}</h1>
                <button
                    class="btn btn-outline btn-sm flex items-center gap-1.5"
                    onClick={() => navigate('/payloads')}
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

            <Show when={isLoading()}>
                <div class="flex flex-col items-center justify-center min-h-[30vh] gap-3">
                    <span class="loading loading-spinner loading-md text-primary"></span>
                    <p class="text-sm text-base-content/60">Loading Form data...</p>
                </div>
            </Show>

            <Show when={!isLoading()}>
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
                                    placeholder="Enter payload name"
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
                                    rows="2"
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
                                    placeholder="Select or enter payload type"
                                    required
                                    class="input input-bordered w-full"
                                    list="available-types"
                                    value={type()}
                                    onInput={(e) => setType(e.currentTarget.value)}
                                />
                                <datalist id="available-types">
                                    <For each={availableTypes()}>
                                        {(item) => <option value={item} />}
                                    </For>
                                </datalist>
                            </div>

                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold">Metadata</span>
                                </label>
                                <textarea
                                    placeholder='{ "key": "value" }'
                                    rows="5"
                                    class="textarea textarea-bordered w-full font-mono text-xs"
                                    value={metadata()}
                                    onInput={(e) => setMetadata(e.currentTarget.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Card */}
                    <div class="card bg-base-100 border border-base-200 shadow-sm">
                        <div class="card-body p-5 space-y-4">
                            <h2 class="card-title text-base font-semibold border-b border-base-200 pb-2">File</h2>

                            <Show when={isEdit() && entity()?.attachmentName}>
                                <div class="flex items-center gap-2 text-sm">
                                    <span class="text-base-content/60">Current Asset:</span>
                                    <span class="font-semibold">{entity().attachmentName}</span>
                                </div>
                            </Show>

                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text font-semibold">Upload File</span>
                                </label>
                                <input
                                    type="file"
                                    class="file-input file-input-bordered w-full"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAttachmentFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <Show when={type() && mimeMappings()[type()] && mimeMappings()[type()].length > 0}>
                                    <label class="label">
                                        <span class="label-text-alt text-base-content/50">
                                            Supported formats for {type()}: {mimeMappings()[type()].join(', ')}
                                        </span>
                                    </label>
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
            </Show>
        </div>
    );
}
