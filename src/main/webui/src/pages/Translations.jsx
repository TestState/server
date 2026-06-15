import React from 'react';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Badge, Button, Card, Center, Group, Loader, Stack, Table, Text, Title} from '@mantine/core';
import {IconPlus} from '@tabler/icons-react';

export default function Translations() {
    const navigate = useNavigate();

    const {data: sessions = [], isPending: loading, error} = useQuery({
        queryKey: ['translationsSessions'],
        queryFn: () => safeFetch('/api/translations/sessions').then(res => {
            if (!Array.isArray(res)) {
                throw new Error("API returned invalid data format");
            }
            return res;
        })
    });

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading translation logs...</Text>
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


    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>History</Title>
                <Button leftSection={<IconPlus size="1rem"/>} onClick={() => navigate('/translations/new')}>
                    New
                </Button>
            </Group>

            {/* Translations Table */}
            <Card withBorder shadow="sm" radius="md" p="0">
                <Table verticalSpacing="md" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Format</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th style={{textAlign: 'right'}}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sessions.map((session) => (
                            <Table.Tr key={session.sessionId}>
                                <Table.Td>
                                    <Text size="xs" style={{fontFamily: 'monospace'}}>{session.sessionId}</Text>
                                </Table.Td>
                                <Table.Td>
                                    {session.format ? (
                                        <Badge color="blue" variant="filled" size="xs">
                                            {session.format}
                                        </Badge>
                                    ) : '-'}
                                </Table.Td>
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
                                <Table.Td>
                                    <Group justify="flex-end">
                                        <Button size="xs" variant="light"
                                                onClick={() => navigate(`/translations/${session.sessionId}/status`)}>
                                            Monitor
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {sessions.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={4} style={{textAlign: 'center', padding: '24px 0'}}>
                                    <Text c="dimmed" size="sm" mb="xs">No active translation sessions.</Text>
                                    <Button size="xs" variant="subtle" onClick={() => navigate('/translations/new')}>
                                        Start one.
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}
