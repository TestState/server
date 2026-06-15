import React, {useEffect, useState} from 'react';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getDisplayDuration, getStatusColor} from '../utils/format';
import {useNavigate, useParams} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
    Accordion,
    Alert,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Image,
    Loader,
    SimpleGrid,
    Stack,
    Text,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconCode, IconDownload, IconExternalLink} from '@tabler/icons-react';


function StepCard({step}) {
    const status = step.status || 'PENDING';
    const displayStatus = getCleanStatus(status);

    const metadata = step.summary?.metadata || {};
    const hasMetadata = Object.keys(metadata).length > 0;
    const hasSubSteps = step.steps && step.steps.length > 0;
    const duration = step.summary?.totalDuration ?? 0;

    return (
        <Accordion variant="contained" radius="md" style={{marginBottom: 8}}>
            <Accordion.Item value={step.name || 'Unnamed Step'}>
                <Accordion.Control>
                    <Group justify="space-between" style={{width: '100%'}} wrap="wrap">
                        <Group gap="xs">
                            <Badge color={getStatusColor(status)} size="xs" variant="filled">
                                {displayStatus}
                            </Badge>
                            <Text fw={600} size="xs">{step.name || 'Unnamed Step'}</Text>
                        </Group>
                        <Text size="xs" style={{fontFamily: 'monospace'}}
                              c="dimmed">{getDisplayDuration(duration)}</Text>
                    </Group>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="xs">
                        {hasMetadata && (
                            <pre style={{
                                backgroundColor: '#141414',
                                color: '#1c7ed6',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                overflowX: 'auto',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                margin: 0
                            }}>
                {JSON.stringify(metadata, null, 2)}
              </pre>
                        )}
                        {hasSubSteps && (
                            <div style={{
                                paddingLeft: 12,
                                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                                marginTop: 8
                            }}>
                                {step.steps.map((subStep, idx) => (
                                    <StepCard key={idx} step={subStep}/>
                                ))}
                            </div>
                        )}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}

export default function TestStatus() {
    const {sessionId} = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [telemetryLogs, setTelemetryLogs] = useState([]);

    const {data: session, isPending: loading, error} = useQuery({
        queryKey: ['testSession', sessionId],
        queryFn: () => safeFetch(`/api/tests/sessions/${sessionId}`)
    });

    useEffect(() => {
        let active = true;
        let ws;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/telemetry/test/${sessionId}`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'STATUS') {
                    queryClient.setQueryData(['testSession', sessionId], prev =>
                        prev ? {...prev, status: msg.state, statusMessage: msg.message} : null
                    );
                } else if (msg.type === 'RESULT') {
                    queryClient.setQueryData(['testSession', sessionId], prev =>
                        prev ? {...prev, result: msg.result} : null
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

        return () => {
            active = false;
            if (ws) ws.close();
        };
    }, [sessionId, queryClient]);

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
                    <Button leftSection={<IconArrowLeft size="1rem"/>} onClick={() => navigate('/tests')}>
                        Back to Tests
                    </Button>
                </Stack>
            </Card>
        );
    }

    const getAttachmentDownloadUrl = (index) => {
        return `/api/tests/sessions/${sessionId}/attachments/${index}`;
    };

    const hasResult = !!session.result;
    const resultData = session.result;
    const reports = resultData?.reports || [];
    const attachments = resultData?.attachments || [];
    const summary = resultData?.summary;

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center" wrap="wrap">
                <Stack gap={0}>
                    <Title order={2}>Session Status</Title>
                    <Text size="xs" style={{fontFamily: 'monospace'}} c="dimmed">{sessionId}</Text>
                </Stack>
                <Group gap="sm">
                    <Button
                        variant="light"
                        leftSection={<IconExternalLink size="1rem"/>}
                        component="a"
                        href={`/api/tests/sessions/${sessionId}/report`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Export
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconCode size="1rem"/>}
                        component="a"
                        href={`/api/tests/sessions/${sessionId}/report?full=true`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        JSON
                    </Button>
                    <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                            onClick={() => navigate('/tests')}>
                        Return
                    </Button>
                </Group>
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

                <SimpleGrid cols={{base: 1, sm: 3}} spacing="md" mt="md" mb="md"
                            style={{borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 16}}>
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed">Agent Name</Text>
                        <Text fw={600}>{session.agentName || 'N/A'}</Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed">Agent ID</Text>
                        <Text style={{fontFamily: 'monospace', fontSize: '11px'}}>{session.agentId || 'N/A'}</Text>
                    </Stack>
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed">Negotiation Time</Text>
                        <Text
                            fw={600}>{session.negotiationDurationMs ? `${session.negotiationDurationMs} ms` : 'N/A'}</Text>
                    </Stack>
                </SimpleGrid>

                {session.statusMessage && (
                    <Alert color="blue" title="Status Message" mb="md">
                        {session.statusMessage}
                    </Alert>
                )}

                {reports.length > 0 && (
                    <Stack gap="xs" mt="md">
                        <Text fw={600} size="sm">Execution Steps</Text>
                        <div>
                            {reports.map((report, idx) => (
                                <StepCard key={idx} step={report}/>
                            ))}
                        </div>
                    </Stack>
                )}
            </Card>

            {/* Summary Section */}
            {hasResult && summary && (
                <Card withBorder shadow="sm" radius="md" p="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={600}>Summary</Text>
                    </Card.Section>
                    <Stack gap="xs" mt="md">
                        <Group gap="xs">
                            <Text size="sm" c="dimmed">Duration:</Text>
                            <Text fw={600}
                                  style={{fontFamily: 'monospace'}}>{getDisplayDuration(summary.totalDuration)}</Text>
                        </Group>
                        {summary.metadata && Object.keys(summary.metadata).length > 0 && (
                            <pre style={{
                                backgroundColor: '#141414',
                                color: '#1c7ed6',
                                padding: 16,
                                borderRadius: '8px',
                                overflowX: 'auto',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                margin: 0
                            }}>
                {JSON.stringify(summary.metadata, null, 2)}
              </pre>
                        )}
                    </Stack>
                </Card>
            )}

            {/* Assets Section */}
            {hasResult && attachments.length > 0 && (
                <Card withBorder shadow="sm" radius="md" p="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={600}>Assets</Text>
                    </Card.Section>

                    <SimpleGrid cols={{base: 1, sm: 2, md: 3}} spacing="md" mt="md">
                        {attachments.map((attachment, index) => {
                            const url = getAttachmentDownloadUrl(index);
                            const isImage = attachment.mimeType?.startsWith('image/');
                            return (
                                <Card key={index} withBorder p="xs"
                                      style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                                    <Text fw={600} size="sm" truncate title={attachment.name} mb="xs">
                                        {attachment.name}
                                    </Text>
                                    <Text size="xs" c="dimmed" mb="md">
                                        {attachment.mimeType}
                                    </Text>
                                    {isImage && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            height: 120,
                                            alignItems: 'center',
                                            backgroundColor: '#141414',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            marginBottom: 12
                                        }}>
                                            <Image
                                                src={url}
                                                alt={attachment.name}
                                                fit="contain"
                                                height={110}
                                            />
                                        </div>
                                    )}
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconDownload size="0.8rem"/>}
                                        component="a"
                                        href={url}
                                        download={attachment.name}
                                    >
                                        Download
                                    </Button>
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
