import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Table, Text, Title} from '@mantine/core';
import {IconCopy, IconEdit, IconPlayerPlay, IconPlus, IconTrash} from '@tabler/icons-react';

export default function Tests() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {data, isPending: loading, error} = useQuery({
        queryKey: ['tests-data'],
        queryFn: async () => {
            const [tests, sessions, batches] = await Promise.all([
                safeFetch('/api/tests'),
                safeFetch('/api/tests/sessions'),
                safeFetch('/api/tests/batches')
            ]);
            return {tests, sessions, batches};
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => safeFetch(`/api/tests/${id}`, {method: 'DELETE'}),
        onSuccess: () => {
            alert('Test deleted successfully');
            queryClient.invalidateQueries({queryKey: ['tests-data']});
        },
        onError: (err) => {
            alert('Failed to delete test: ' + err.message);
        }
    });

    const copyMutation = useMutation({
        mutationFn: (id) => safeFetch(`/api/tests/${id}/copy`, {method: 'POST'}),
        onSuccess: () => {
            alert('Test duplicated successfully');
            queryClient.invalidateQueries({queryKey: ['tests-data']});
        },
        onError: (err) => {
            alert('Failed to duplicate test: ' + err.message);
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this test configuration?')) {
            deleteMutation.mutate(id);
        }
    };


    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading test suites...</Text>
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

    const hasBatches = data.batches && data.batches.length > 0;
    const hasSessions = data.sessions && data.sessions.length > 0;

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>Tests</Title>
                <Button leftSection={<IconPlus size="1rem"/>} onClick={() => navigate('/tests/new')}>
                    New
                </Button>
            </Group>

            {/* Tests Table */}
            <Card withBorder shadow="sm" radius="md" p="0">
                <Table verticalSpacing="md" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Payloads</Table.Th>
                            <Table.Th style={{textAlign: 'right'}}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {(data.tests || []).map((test) => (
                            <Table.Tr key={test.id}>
                                <Table.Td>
                                    <Text fw={600} size="sm">{test.name}</Text>
                                    {test.description && (
                                        <Text size="xs" c="dimmed">{test.description}</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color="blue" variant="light" style={{fontFamily: 'monospace'}}>
                                        {test.testType}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs" c="dimmed">
                                        {test.payloads?.length || 0} linked
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            leftSection={<IconPlayerPlay size="0.8rem"/>}
                                            onClick={() => navigate(`/tests/${test.id}/run`)}
                                        >
                                            Run
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="gray"
                                            leftSection={<IconCopy size="0.8rem"/>}
                                            onClick={() => copyMutation.mutate(test.id)}
                                            loading={copyMutation.isPending && copyMutation.variables === test.id}
                                        >
                                            Copy
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="blue"
                                            leftSection={<IconEdit size="0.8rem"/>}
                                            onClick={() => navigate(`/tests/${test.id}/edit`)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="red"
                                            leftSection={<IconTrash size="0.8rem"/>}
                                            onClick={() => handleDelete(test.id)}
                                            loading={deleteMutation.isPending && deleteMutation.variables === test.id}
                                        >
                                            Delete
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {(data.tests || []).length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={4} style={{textAlign: 'center', padding: '24px 0'}}>
                                    <Text c="dimmed" size="sm" mb="xs">Empty.</Text>
                                    <Button size="xs" variant="subtle" onClick={() => navigate('/tests/new')}>
                                        New.
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Batches and Sessions History */}
            <SimpleGrid cols={{base: 1, md: 2}} spacing="lg">
                {hasBatches && (
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Recent Batches</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            {data.batches.map((batch, index) => (
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
                            ))}
                        </Stack>
                    </Card>
                )}

                {hasSessions && (
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Recent Sessions</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            {data.sessions.map((session, index) => (
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
                            ))}
                        </Stack>
                    </Card>
                )}
            </SimpleGrid>
        </Stack>
    );
}
