import React, {useEffect, useState} from 'react';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
    Alert,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Loader,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconCheck, IconDeviceFloppy, IconDownload} from '@tabler/icons-react';

function SavePayloadForm({sessionId, item, onSaveSuccess}) {
    const [name, setName] = useState(`Translated: ${item.name || item.type}`);
    const [description, setDescription] = useState(`Translated ${item.type} from session ${sessionId}`);

    const mutation = useMutation({
        mutationFn: (body) => safeFetch(`/api/translations/sessions/${sessionId}/payloads/${item.index}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: () => {
            onSaveSuccess();
        },
        onError: (err) => {
            alert('Failed to save payload: ' + err.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return;
        mutation.mutate({
            name,
            description
        });
    };

    return (
        <form onSubmit={handleSubmit}
              style={{marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)'}}>
            <Text size="xs" c="dimmed" mb="xs">Save as database payload:</Text>
            <Stack gap="xs">
                <TextInput
                    placeholder="Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <TextInput
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Group justify="flex-end">
                    <Button
                        type="submit"
                        leftSection={<IconDeviceFloppy size="0.8rem"/>}
                        loading={mutation.isPending}
                        size="xs"
                    >
                        Save
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

export default function TranslationStatus() {
    const {sessionId} = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [telemetryLogs, setTelemetryLogs] = useState([]);

    const {data: session, isPending: loading, error} = useQuery({
        queryKey: ['translationSession', sessionId],
        queryFn: () => safeFetch(`/api/translations/sessions/${sessionId}`)
    });

    useEffect(() => {
        let active = true;
        let ws;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/telemetry/translation/${sessionId}`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'STATUS') {
                    queryClient.setQueryData(['translationSession', sessionId], (prev) => {
                        return prev ? {...prev, status: msg.state, statusMessage: msg.message} : null;
                    });
                } else if (msg.type === 'RESULT') {
                    const items = msg.result.map(item => ({
                        index: item.index,
                        name: item.name,
                        type: item.type,
                        databaseId: null
                    }));
                    queryClient.setQueryData(['translationSession', sessionId], (prev) => {
                        return prev ? {...prev, generatedItems: items} : null;
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

        return () => {
            active = false;
            if (ws) ws.close();
        };
    }, [sessionId, queryClient]);

    const handleSaveSuccess = () => {
        queryClient.invalidateQueries({queryKey: ['translationSession', sessionId]});
    };

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Waiting...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Card withBorder style={{borderColor: 'red'}} radius="md" p="md">
                <Text c="red" fw={600}>Error: {error.message}</Text>
            </Card>
        );
    }

    if (!session) {
        return (
            <Card withBorder style={{borderColor: 'red'}} radius="md" p="md">
                <Stack gap="md">
                    <Text c="red" fw={600}>Session not found.</Text>
                    <Button leftSection={<IconArrowLeft size="1rem"/>} onClick={() => navigate('/translations')}>
                        Back to Translations
                    </Button>
                </Stack>
            </Card>
        );
    }

    const hasResult = session.generatedItems && session.generatedItems.length > 0;

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center" wrap="wrap">
                <Stack gap={0}>
                    <Title order={2}>Translation Status</Title>
                    <Text size="xs" style={{fontFamily: 'monospace'}} c="dimmed">{sessionId}</Text>
                </Stack>
                <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                        onClick={() => navigate('/translations')}>
                    Return
                </Button>
            </Group>

            {/* Progress Section */}
            <Card withBorder shadow="sm" radius="md" p="md">
                <Card.Section withBorder inheritPadding py="xs">
                    <Group justify="space-between" align="center">
                        <Text fw={600}>Progress</Text>
                        <Badge color={getStatusColor(session.status)} variant="filled">
                            {getCleanStatus(session.status)}
                        </Badge>
                    </Group>
                </Card.Section>
                <Stack mt="md" gap="xs">
                    <Text size="xs" c="dimmed">Status Message</Text>
                    <Text fw={600} size="sm">
                        {session.statusMessage || 'Awaiting agent translation...'}
                    </Text>
                </Stack>
            </Card>

            {/* Result Section */}
            {hasResult && (
                <Card withBorder shadow="sm" radius="md" p="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={600}>Result</Text>
                    </Card.Section>

                    <SimpleGrid cols={{base: 1, md: 2}} spacing="md" mt="md">
                        {session.generatedItems.map((item) => {
                            const dbId = item.databaseId;
                            const isSaved = !!dbId;
                            return (
                                <Card key={item.index} withBorder p="md"
                                      style={{backgroundColor: 'rgba(255,255,255,0.01)'}}>
                                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                                        <Stack gap={0} style={{flex: 1, minWidth: 0}}>
                                            <Text fw={600} size="sm" truncate>{item.name || item.type}</Text>
                                            <Text size="xs" style={{fontFamily: 'monospace'}}
                                                  c="dimmed">{item.type}</Text>
                                        </Stack>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            component="a"
                                            href={`/api/translations/sessions/${sessionId}/payloads/${item.index}/download`}
                                            leftSection={<IconDownload size="0.8rem"/>}
                                        >
                                            Download
                                        </Button>
                                    </Group>

                                    {isSaved ? (
                                        <Alert color="green" icon={<IconCheck size="1rem"/>}
                                               title={`Saved in Database (ID: ${dbId})`}/>
                                    ) : (
                                        <SavePayloadForm
                                            sessionId={sessionId}
                                            item={item}
                                            onSaveSuccess={handleSaveSuccess}
                                        />
                                    )}
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Card>
            )}

            {/* Logs Section */}
            <Card withBorder shadow="sm" radius="md" p="md">
                <Card.Section withBorder inheritPadding py="xs">
                    <Text fw={600}>Logs</Text>
                </Card.Section>
                <div
                    style={{
                        backgroundColor: '#141414',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #303030',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        marginTop: '12px'
                    }}
                >
                    {telemetryLogs.length === 0 ? (
                        <div style={{color: 'rgba(255,255,255,0.3)', fontStyle: 'italic'}}>Awaiting telemetry
                            logs...</div>
                    ) : (
                        telemetryLogs.map((log, idx) => {
                            let logColor = '#b7eb8f'; // Info color
                            if (log.level === 'ERROR') logColor = '#ff4d4f';
                            else if (log.level === 'WARNING') logColor = '#ffc069';
                            return (
                                <div key={idx} style={{color: logColor, marginBottom: 4}}>
                                    [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level}] {log.message}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </Stack>
    );
}
