import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Card, Center, Group, Loader, Stack, Table, Text, Title} from '@mantine/core';
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
                    <Text size="sm" c="dimmed">Loading Payloads...</Text>
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

            {/* Payloads Table */}
            <Card withBorder shadow="sm" radius="md" p="0">
                <Table verticalSpacing="md" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th style={{textAlign: 'right'}}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {payloads.map((payload) => (
                            <Table.Tr key={payload.id}>
                                <Table.Td>
                                    <Text fw={600} size="sm">{payload.name}</Text>
                                    {payload.description && (
                                        <Text size="xs" c="dimmed">{payload.description}</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color="orange" variant="light" style={{fontFamily: 'monospace'}}>
                                        {payload.type}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
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
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {payloads.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={3} style={{textAlign: 'center', padding: '24px 0'}}>
                                    <Text c="dimmed" size="sm" mb="xs">Empty.</Text>
                                    <Button size="xs" variant="subtle" onClick={() => navigate('/payloads/new')}>
                                        New.
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
