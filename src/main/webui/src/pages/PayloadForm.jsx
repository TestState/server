import React, {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Autocomplete,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconDeviceFloppy} from '@tabler/icons-react';

export default function PayloadForm() {
    const {id} = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [metadata, setMetadata] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Queries
    const {data: availableTypes = [], isLoading: loadingTypes} = useQuery({
        queryKey: ['payloadAvailableTypes'],
        queryFn: () => safeFetch('/api/payloads/available-types')
    });

    const {data: mimeMappings = {}, isLoading: loadingMappings} = useQuery({
        queryKey: ['payloadMimeMappings'],
        queryFn: () => safeFetch('/api/payloads/mime-mappings')
    });

    const {data: entity, isLoading: loadingEntity} = useQuery({
        queryKey: ['payload', id],
        queryFn: () => safeFetch(`/api/payloads/${id}`),
        enabled: isEdit
    });

    const saveMutation = useMutation({
        mutationFn: (payloadForm) => {
            const url = isEdit ? `/api/payloads/${id}` : '/api/payloads';
            const method = isEdit ? 'PUT' : 'POST';
            return safeFetch(url, {
                method: method,
                body: payloadForm
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['payloads']});
            navigate('/payloads');
        },
        onError: (err) => {
            setErrorMsg(err.message);
        }
    });

    useEffect(() => {
        if (entity) {
            setName(entity.name || '');
            setDescription(entity.description || '');
            setType(entity.type || '');
            setMetadata(entity.metadata || '');
        } else if (availableTypes.length > 0 && !type) {
            setType(availableTypes[0]);
        }
    }, [entity, availableTypes]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name) {
            setErrorMsg("Name is required");
            return;
        }
        if (!type) {
            setErrorMsg("Type is required");
            return;
        }

        // Validation: check MIME type mapping
        if (attachmentFile && type && mimeMappings[type]) {
            const allowedMimeTypes = mimeMappings[type];
            if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(attachmentFile.type)) {
                setErrorMsg(`Unsupported file type: ${attachmentFile.type} for type ${type}. Expected: ${allowedMimeTypes.join(', ')}`);
                return;
            }
        }

        const payloadForm = new FormData();
        payloadForm.append('name', name);
        payloadForm.append('description', description);
        payloadForm.append('type', type);
        payloadForm.append('metadata', metadata);
        if (attachmentFile) {
            payloadForm.append('attachmentFile', attachmentFile);
        }

        saveMutation.mutate(payloadForm);
    };

    const loading = loadingTypes || loadingMappings || (isEdit && loadingEntity);
    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading Form data...</Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack gap="xl" style={{maxWidth: 800, margin: '0 auto', width: '100%'}}>
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>{isEdit ? 'Edit Payload' : 'New Payload'}</Title>
                <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                        onClick={() => navigate('/payloads')}>
                    Return
                </Button>
            </Group>

            {errorMsg && (
                <Alert title="Validation Error" color="red" withCloseButton onClose={() => setErrorMsg(null)}>
                    {errorMsg}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Settings</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            <TextInput
                                label="Name"
                                placeholder="Enter payload name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter description"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <Autocomplete
                                label="Type"
                                placeholder="Select or enter payload type"
                                required
                                data={availableTypes}
                                value={type}
                                onChange={setType}
                            />

                            <Textarea
                                label="Metadata"
                                placeholder='{ "key": "value" }'
                                rows={5}
                                styles={{input: {fontFamily: 'monospace', fontSize: '12px'}}}
                                value={metadata}
                                onChange={(e) => setMetadata(e.target.value)}
                            />
                        </Stack>
                    </Card>

                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>File</Text>
                        </Card.Section>

                        <Stack gap="sm" mt="md">
                            {isEdit && entity?.attachmentName && (
                                <Group gap="xs">
                                    <Text size="sm" c="dimmed">Current Asset:</Text>
                                    <Text size="sm" fw={600}>{entity.attachmentName}</Text>
                                </Group>
                            )}

                            <Text size="sm" fw={500}>Upload File</Text>
                            <input
                                type="file"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAttachmentFile(e.target.files[0]);
                                    }
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: 'inherit',
                                    cursor: 'pointer'
                                }}
                            />
                            {type && mimeMappings[type] && mimeMappings[type].length > 0 && (
                                <Text size="xs" c="dimmed">
                                    Supported formats for {type}: {mimeMappings[type].join(', ')}
                                </Text>
                            )}
                        </Stack>
                    </Card>

                    <Button
                        type="submit"
                        leftSection={<IconDeviceFloppy size="1rem"/>}
                        loading={saveMutation.isPending}
                        size="md"
                        mt="md"
                    >
                        Save
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
}
