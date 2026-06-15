import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title} from '@mantine/core';
import {IconDownload, IconEdit, IconPlus, IconTrash} from '@tabler/icons-react';

export default function Payloads() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {data: payloads = [], isPending: loading, error} = useQuery({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads').then(res => {
            if (!Array.isArray(res)) {
                throw new Error("API returned invalid data format");
            }
            return res;
        })
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => safeFetch(`/api/payloads/${id}`, {method: 'DELETE'}),
        onSuccess: () => {
            alert('Payload deleted successfully');
            queryClient.invalidateQueries({queryKey: ['payloads']});
        },
        onError: (err) => {
            alert('Failed to delete payload: ' + err.message);
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this payload?')) {
            deleteMutation.mutate(id);
        }
    };

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading payloads...</Text>
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

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>Payloads</Title>
                <Button leftSection={<IconPlus size="1rem"/>} onClick={() => navigate('/payloads/new')}>
                    New
                </Button>
            </Group>

            {/* Payloads Grid */}
            {payloads.length === 0 ? (
                <Card withBorder p="xl" radius="md" style={{textAlign: 'center'}}>
                    <Text c="dimmed" size="sm" mb="xs">No payloads configured.</Text>
                    <Center>
                        <Button size="xs" variant="subtle" onClick={() => navigate('/payloads/new')}>
                            Create New
                        </Button>
                    </Center>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    {payloads.map((payload) => (
                        <Card key={payload.id} withBorder p="md" shadow="xs" radius="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                            <Stack gap="xs" style={{ flexGrow: 1 }}>
                                <Group justify="space-between" align="flex-start" wrap="nowrap">
                                    <Text fw={600} size="sm" truncate>{payload.name}</Text>
                                    <Badge color="orange" variant="light" style={{fontFamily: 'monospace'}}>
                                        {payload.type}
                                    </Badge>
                                </Group>
                                {payload.description && (
                                    <Text size="xs" c="dimmed" lineClamp={3} style={{ flexGrow: 1 }}>
                                        {payload.description}
                                    </Text>
                                )}
                            </Stack>
                            <div style={{height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '12px 0 8px 0'}}/>
                            <Group gap="xs" justify="flex-end">
                                {payload.attachmentName && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        component="a"
                                        href={`/api/payloads/${payload.id}/attachment`}
                                        leftSection={<IconDownload size="0.8rem"/>}
                                        title={`Export: ${payload.attachmentName}`}
                                    >
                                        Export
                                    </Button>
                                )}
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconEdit size="0.8rem"/>}
                                    onClick={() => navigate(`/payloads/${payload.id}/edit`)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconTrash size="0.8rem"/>}
                                    onClick={() => handleDelete(payload.id)}
                                    loading={deleteMutation.isPending && deleteMutation.variables === payload.id}
                                >
                                    Delete
                                </Button>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
