import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Table, Text, Title} from '@mantine/core';
import {IconPlayerPlay, IconPlus} from '@tabler/icons-react';

export default function Dashboard() {
    const navigate = useNavigate();

    const statsQuery = useQuery({
        queryKey: ['statistics'],
        queryFn: () => safeFetch('/api/statistics')
    });

    const agentsQuery = useQuery({
        queryKey: ['agents'],
        queryFn: () => safeFetch('/api/agents')
    });

    const sessionsQuery = useQuery({
        queryKey: ['sessions'],
        queryFn: () => safeFetch('/api/tests/sessions')
    });

    const batchesQuery = useQuery({
        queryKey: ['batches'],
        queryFn: () => safeFetch('/api/tests/batches')
    });

    const testsQuery = useQuery({
        queryKey: ['tests'],
        queryFn: () => safeFetch('/api/tests')
    });

    const payloadsQuery = useQuery({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads')
    });

    const loading = statsQuery.isPending || agentsQuery.isPending || sessionsQuery.isPending || batchesQuery.isPending || testsQuery.isPending || payloadsQuery.isPending;
    const error = statsQuery.error || agentsQuery.error || sessionsQuery.error || batchesQuery.error || testsQuery.error || payloadsQuery.error;

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading Dashboard metrics...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Card withBorder style={{borderColor: 'red'}} radius="md" p="md">
                <Text c="red" fw={600}>Error: {error.message || String(error)}</Text>
            </Card>
        );
    }


    const agents = agentsQuery.data || [];

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>Dashboard</Title>
                <Group gap="sm">
                    <Button
                        leftSection={<IconPlayerPlay size="1rem"/>}
                        onClick={() => navigate('/tests/new')}
                    >
                        New Test
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconPlus size="1rem"/>}
                        onClick={() => navigate('/payloads/new')}
                    >
                        New Payload
                    </Button>
                </Group>
            </Group>

            {/* Overview Section */}
            <Stack gap="xs">
                <Title order={4} c="dimmed">Overview</Title>
                <SimpleGrid cols={{base: 2, xs: 3, md: 6}} spacing="md">
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Tests</Text>
                        <Text fw={700} size="xl" mt="xs">{testsQuery.data?.length || 0}</Text>
                    </Card>
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Payloads</Text>
                        <Text fw={700} size="xl" mt="xs">{payloadsQuery.data?.length || 0}</Text>
                    </Card>
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Nodes</Text>
                        <Text fw={700} size="xl" mt="xs">{agentsQuery.data?.length || 0}</Text>
                    </Card>
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Sessions</Text>
                        <Text fw={700} size="xl" mt="xs">{sessionsQuery.data?.length || 0}</Text>
                    </Card>
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Avg Time</Text>
                        <Text fw={700} size="xl"
                              mt="xs">{Number(statsQuery.data?.avgNegotiationTime ?? 0).toFixed(2)} ms</Text>
                    </Card>
                    <Card withBorder shadow="sm" radius="md" p="md" style={{textAlign: 'center'}}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Rate</Text>
                        <Text fw={700} size="xl" mt="xs">{Number(statsQuery.data?.throughput ?? 0).toFixed(2)}/m</Text>
                    </Card>
                </SimpleGrid>
            </Stack>

            {/* Nodes Section */}
            <Card withBorder shadow="sm" radius="md" p="md">
                <Card.Section withBorder inheritPadding py="xs">
                    <Text fw={600}>Nodes</Text>
                </Card.Section>
                <Table verticalSpacing="md" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Node</Table.Th>
                            <Table.Th>Capabilities</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {agents.map((agent) => (
                            <Table.Tr key={agent.id}>
                                <Table.Td>
                                    <Text fw={600} size="sm">{agent.name}</Text>
                                    <Text size="xs" style={{fontFamily: 'monospace', opacity: 0.65}}>{agent.id}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" wrap="wrap">
                                        {agent.capabilities?.map((cap, i) => {
                                            if (cap.hasTest && cap.test?.type) {
                                                return <Badge color="blue" variant="light"
                                                              key={i}>{cap.test.type}</Badge>;
                                            } else if (cap.hasTranslation && cap.translation?.type) {
                                                return <Badge color="green" variant="light"
                                                              key={i}>{cap.translation.type}</Badge>;
                                            }
                                            const label = typeof cap === 'string' ? cap : cap.name || JSON.stringify(cap);
                                            return <Badge color="gray" variant="light" key={i}>{label}</Badge>;
                                        })}
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {agents.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={2} style={{textAlign: 'center', color: 'gray'}}>No active
                                    nodes</Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Batches and Sessions (2-column responsive layout) */}
            <SimpleGrid cols={{base: 1, md: 2}} spacing="lg">
                {/* Batches */}
                <Card withBorder shadow="sm" radius="md" p="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={600}>Recent Batches</Text>
                    </Card.Section>

                    <Stack gap="md" mt="md">
                        {(!batchesQuery.data || batchesQuery.data.length === 0) ? (
                            <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '16px 0'}}>No
                                batches</Text>
                        ) : (
                            batchesQuery.data.slice(0, 8).map((batch, index) => (
                                <div key={batch.batchId}>
                                    {index > 0 && <div style={{
                                        height: '1px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                        marginBottom: '12px'
                                    }}/>}
                                    <Group justify="space-between" align="center" wrap="nowrap">
                                        <Stack gap="xs" style={{flex: 1, minWidth: 0}}>
                                            <Text fw={600} size="sm" truncate>{batch.testName}</Text>
                                            <Group gap="xs">
                                                <Text size="xs" style={{
                                                    fontFamily: 'monospace',
                                                    opacity: 0.65
                                                }}>{batch.batchId}</Text>
                                                <Badge color={getStatusColor(batch.status)} size="xs" variant="filled">
                                                    {getCleanStatus(batch.status)}
                                                </Badge>
                                            </Group>
                                        </Stack>
                                        <Button size="xs" variant="subtle"
                                                onClick={() => navigate(`/tests/batch/${batch.batchId}/status`)}>
                                            Monitor
                                        </Button>
                                    </Group>
                                </div>
                            ))
                        )}
                    </Stack>
                </Card>

                {/* Sessions */}
                <Card withBorder shadow="sm" radius="md" p="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={600}>Recent Sessions</Text>
                    </Card.Section>

                    <Stack gap="md" mt="md">
                        {(!sessionsQuery.data || sessionsQuery.data.length === 0) ? (
                            <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '16px 0'}}>No
                                sessions</Text>
                        ) : (
                            sessionsQuery.data.slice(0, 8).map((session, index) => (
                                <div key={session.sessionId}>
                                    {index > 0 && <div style={{
                                        height: '1px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                        marginBottom: '12px'
                                    }}/>}
                                    <Group justify="space-between" align="center" wrap="nowrap">
                                        <Stack gap="xs" style={{flex: 1, minWidth: 0}}>
                                            <Text fw={600} size="sm"
                                                  truncate>{session.ticket?.testType || session.agentName}</Text>
                                            <Group gap="xs">
                                                <Text size="xs" style={{
                                                    fontFamily: 'monospace',
                                                    opacity: 0.65
                                                }}>{session.sessionId}</Text>
                                                <Badge color={getStatusColor(session.status)} size="xs"
                                                       variant="filled">
                                                    {getCleanStatus(session.status)}
                                                </Badge>
                                            </Group>
                                        </Stack>
                                        <Button size="xs" variant="subtle"
                                                onClick={() => navigate(`/tests/session/${session.sessionId}/status`)}>
                                            Inspect
                                        </Button>
                                    </Group>
                                </div>
                            ))
                        )}
                    </Stack>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
