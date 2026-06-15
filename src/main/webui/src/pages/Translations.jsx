import React from 'react';
import {safeFetch} from '../utils/safeFetch';
import {getCleanStatus, getStatusColor} from '../utils/format';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title} from '@mantine/core';
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

            {/* Translations Grid */}
            {sessions.length === 0 ? (
                <Card withBorder p="xl" radius="md" style={{textAlign: 'center'}}>
                    <Text c="dimmed" size="sm" mb="xs">No active translation sessions.</Text>
                    <Center>
                        <Button size="xs" variant="subtle" onClick={() => navigate('/translations/new')}>
                            Start one
                        </Button>
                    </Center>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {sessions.map((session) => (
                        <Card key={session.sessionId} withBorder p="md" shadow="xs" radius="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                            <Stack gap="xs" style={{ flexGrow: 1 }}>
                                <Group justify="space-between" align="center" wrap="nowrap">
                                    <Text size="xs" style={{fontFamily: 'monospace', flexGrow: 1}} truncate>{session.sessionId}</Text>
                                    {session.format && (
                                        <Badge color="blue" variant="filled" size="xs">
                                            {session.format}
                                        </Badge>
                                    )}
                                </Group>
                                <Group gap="xs">
                                    <Badge color={getStatusColor(session.status)} variant="filled" size="xs">
                                        {getCleanStatus(session.status)}
                                    </Badge>
                                    {session.statusMessage && (
                                        <Text size="xs" c="dimmed" truncate style={{maxWidth: '100%'}} title={session.statusMessage}>
                                            ({session.statusMessage})
                                        </Text>
                                    )}
                                </Group>
                            </Stack>
                            <div style={{height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '12px 0 8px 0'}}/>
                            <Group justify="flex-end">
                                <Button size="xs" variant="light" onClick={() => navigate(`/translations/${session.sessionId}/status`)}>
                                    Monitor
                                </Button>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
