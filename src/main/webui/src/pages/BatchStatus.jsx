import React, {useEffect} from 'react';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
    Badge,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Progress,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconCircleX, IconCode, IconDownload} from '@tabler/icons-react';

export default function BatchStatus() {
    const {batchId} = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {data: batch, isPending: loading, error} = useQuery({
        queryKey: ['batch', batchId],
        queryFn: () => safeFetch(`/api/tests/batches/${batchId}`)
    });

    const cancelMutation = useMutation({
        mutationFn: () => safeFetch(`/api/tests/batches/${batchId}/cancel`, {method: 'POST'}),
        onSuccess: () => {
            alert('Batch execution stop request sent');
            queryClient.invalidateQueries({queryKey: ['batch', batchId]});
        },
        onError: (err) => {
            alert('Failed to cancel batch: ' + err.message);
        }
    });

    useEffect(() => {
        let active = true;
        let ws;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/telemetry/test/batch/${batchId}`);

        ws.onmessage = (event) => {
            if (!active) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'BATCH_UPDATE') {
                    queryClient.setQueryData(['batch', batchId], {
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
                            sessionId: s.sessionId,
                            status: s.state,
                            message: s.message,
                            agentId: s.agentId,
                            agentName: s.agentName,
                            negotiationDurationMs: s.negotiationDurationMs
                        })) || []
                    });
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
    }, [batchId, queryClient]);

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

    const cancelling = cancelMutation.isPending;
    const isCancelable = batch.status === 'PENDING' || batch.status === 'RUNNING';

    // getStatusColor and getCleanStatus are imported from utils/format

    const sessions = batch.sessions || [];
    const total = batch.iterations || 0;
    const passed = batch.passedCount !== undefined ? batch.passedCount : sessions.filter(s => s.status?.includes('COMPLETED') || s.status?.includes('SUCCESS')).length;
    const failed = batch.failedCount !== undefined ? batch.failedCount : sessions.filter(s => s.status?.includes('FAILED') || s.status?.includes('ERROR')).length;
    const running = batch.runningCount !== undefined ? batch.runningCount : sessions.filter(s => s.status?.includes('RUNNING')).length;
    const pending = batch.pendingCount !== undefined ? batch.pendingCount : Math.max(0, total - (passed + failed) - running);

    const rate = typeof batch.throughput === 'number' ? batch.throughput.toFixed(2) : batch.throughput || '0.00';
    const time = typeof batch.averageNegotiationDuration === 'number' ? batch.averageNegotiationDuration.toFixed(2) : batch.averageNegotiationDuration || '0.00';

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to stop this batch run?')) {
            cancelMutation.mutate();
        }
    };

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center" wrap="wrap">
                <Stack gap={0}>
                    <Title order={2}>Batch Hub</Title>
                    <Text size="xs" style={{fontFamily: 'monospace'}} c="dimmed">{batchId}</Text>
                </Stack>
                <Group gap="sm">
                    <Button
                        variant="light"
                        leftSection={<IconDownload size="1rem"/>}
                        component="a"
                        href={`/api/tests/batches/${batchId}/report`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Export
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconCode size="1rem"/>}
                        component="a"
                        href={`/api/tests/batches/${batchId}/report?full=true`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        JSON
                    </Button>
                    {isCancelable && (
                        <Button
                            color="red"
                            leftSection={<IconCircleX size="1rem"/>}
                            onClick={handleCancel}
                            loading={cancelling}
                        >
                            Stop
                        </Button>
                    )}
                    <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                            onClick={() => navigate('/tests')}>
                        Return
                    </Button>
                </Group>
            </Group>

            {/* Progress Card */}
            <Card withBorder shadow="sm" radius="md" p="md">
                <Card.Section withBorder inheritPadding py="xs">
                    <Text fw={600}>Progress</Text>
                </Card.Section>

                <SimpleGrid cols={{base: 2, sm: 4, lg: 8}} spacing="md" mt="md" mb="md">
                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Status</Text>
                        <Center mt="xs">
                            <Badge color={getStatusColor(batch.status)} variant="filled">
                                {getCleanStatus(batch.status)}
                            </Badge>
                        </Center>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total</Text>
                        <Text fw={700} size="md" mt="xs">{total}</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="green" size="xs" tt="uppercase" fw={700}>Passed</Text>
                        <Text fw={700} size="md" mt="xs" c="green">{passed}</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="red" size="xs" tt="uppercase" fw={700}>Failed</Text>
                        <Text fw={700} size="md" mt="xs" c="red">{failed}</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="yellow" size="xs" tt="uppercase" fw={700}>Running</Text>
                        <Text fw={700} size="md" mt="xs" c="yellow">{running}</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Pending</Text>
                        <Text fw={700} size="md" mt="xs">{pending}</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Rate</Text>
                        <Text fw={700} size="md" mt="xs">{rate}/m</Text>
                    </Card>

                    <Card withBorder p="xs" style={{textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Time</Text>
                        <Text fw={700} size="md" mt="xs">{time}ms</Text>
                    </Card>
                </SimpleGrid>

                {total > 0 && (
                    <Progress.Root size="lg" radius="xl" mt="md">
                        {passed > 0 && <Progress.Section value={(passed / total) * 100} color="green"
                                                         title={`Passed: ${passed}`}/>}
                        {failed > 0 &&
                            <Progress.Section value={(failed / total) * 100} color="red" title={`Failed: ${failed}`}/>}
                        {running > 0 && <Progress.Section value={(running / total) * 100} color="yellow"
                                                          title={`Running: ${running}`}/>}
                        {pending > 0 && <Progress.Section value={(pending / total) * 100} color="gray"
                                                          title={`Pending: ${pending}`}/>}
                    </Progress.Root>
                )}
            </Card>

            {/* Sessions Table */}
            <Card withBorder shadow="sm" radius="md" p="0">
                <Card.Section withBorder inheritPadding py="xs">
                    <Text fw={600}>Sessions</Text>
                </Card.Section>
                <Table verticalSpacing="md" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Node</Table.Th>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>State</Table.Th>
                            <Table.Th style={{textAlign: 'right'}}>Time</Table.Th>
                            <Table.Th style={{textAlign: 'right'}}>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sessions.map((session) => (
                            <Table.Tr key={session.sessionId}>
                                <Table.Td><Text fw={600} size="sm">{session.agentName}</Text></Table.Td>
                                <Table.Td><Text size="xs"
                                                style={{fontFamily: 'monospace'}}>{session.sessionId}</Text></Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Badge color={getStatusColor(session.status)} variant="filled" size="xs">
                                            {getCleanStatus(session.status)}
                                        </Badge>
                                        {session.statusMessage && (
                                            <Text size="xs" c="dimmed" truncate style={{maxWidth: 200}}
                                                  title={session.statusMessage}>
                                                ({session.statusMessage})
                                            </Text>
                                        )}
                                    </Group>
                                </Table.Td>
                                <Table.Td style={{textAlign: 'right'}}>
                                    <Text
                                        size="xs">{session.negotiationDurationMs > 0 ? `${session.negotiationDurationMs}ms` : '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group justify="flex-end">
                                        <Button size="xs" variant="light"
                                                onClick={() => navigate(`/tests/session/${session.sessionId}/status`)}>
                                            View
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {sessions.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5} style={{textAlign: 'center', padding: '16px 0', color: 'gray'}}>
                                    No sessions
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}
