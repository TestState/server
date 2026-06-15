import React, {useEffect, useState} from 'react';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Alert, Badge, Button, Card, Center, Checkbox, Group, Loader, Select, Stack, Text, Title} from '@mantine/core';
import {IconArrowLeft, IconPlayerPlay} from '@tabler/icons-react';

export default function TranslationForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState(null);

    const [agentId, setAgentId] = useState('');
    const [type, setType] = useState('');
    const [payloadIds, setPayloadIds] = useState([]);

    const {data: agents = [], isPending: loadingAgents} = useQuery({
        queryKey: ['agents'],
        queryFn: () => safeFetch('/api/agents')
    });

    const {data: payloads = [], isPending: loadingPayloads} = useQuery({
        queryKey: ['payloads'],
        queryFn: () => safeFetch('/api/payloads')
    });

    const mutation = useMutation({
        mutationFn: (body) => safeFetch('/api/translations/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({queryKey: ['translationsSessions']});
            if (res.sessionId) {
                navigate(`/translations/${res.sessionId}/status`);
            }
        },
        onError: (err) => {
            setFormError(err.message);
        }
    });

    const currentAgent = agents.find(a => a.id === agentId);
    const currentTranslation = currentAgent?.supportedTranslations?.find(t => t.type === type);
    const allowedSources = currentTranslation?.sourcePayloadTypes || [];

    const filteredPayloads = type
        ? payloads.filter(p => allowedSources.includes(p.type))
        : payloads;

    const handleAgentChange = (value) => {
        setAgentId(value || '');
        setType('');
        setPayloadIds([]);
    };

    const handleTypeChange = (value) => {
        setType(value || '');
        setPayloadIds([]);
    };

    useEffect(() => {
        if (type && payloadIds.length > 0) {
            const validIds = payloadIds.filter(id => {
                const p = payloads.find(x => x.id === id);
                return p && allowedSources.includes(p.type);
            });
            if (validIds.length !== payloadIds.length) {
                setPayloadIds(validIds);
            }
        }
    }, [type, allowedSources, payloads, payloadIds]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!agentId) {
            setFormError('Please select a translation node.');
            return;
        }
        if (!type) {
            setFormError('Please select a translation type.');
            return;
        }
        setFormError(null);
        mutation.mutate({
            agentId,
            type,
            payloadIds
        });
    };

    const handlePayloadCheck = (id, checked) => {
        if (checked) {
            setPayloadIds(prev => [...prev, id]);
        } else {
            setPayloadIds(prev => prev.filter(val => val !== id));
        }
    };

    const loading = loadingAgents || loadingPayloads;
    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading translation profiles...</Text>
                </Stack>
            </Center>
        );
    }

    const error = formError || mutation.error?.message;

    return (
        <Stack gap="xl" style={{maxWidth: 800, margin: '0 auto', width: '100%'}}>
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>New Translation</Title>
                <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                        onClick={() => navigate('/translations')}>
                    Cancel
                </Button>
            </Group>

            {error && (
                <Alert title="Translation Request Error" color="red" withCloseButton onClose={() => setFormError(null)}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Task</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            <Select
                                label="Node"
                                placeholder="Select translation node"
                                required
                                data={agents.map(agent => ({value: agent.id, label: agent.name}))}
                                value={agentId}
                                onChange={handleAgentChange}
                            />

                            <Select
                                label="Type"
                                placeholder={agentId ? "Select translation format type" : "Select node first"}
                                required
                                disabled={!agentId}
                                data={currentAgent?.supportedTranslations?.map(trans => ({
                                    value: trans.type,
                                    label: trans.type
                                })) || []}
                                value={type}
                                onChange={handleTypeChange}
                            />

                            {currentTranslation && (
                                <Group gap="xs" style={{fontSize: '12px', fontFamily: 'monospace'}}>
                                    <Badge color="cyan" variant="light">{allowedSources.join(', ')}</Badge>
                                    <span>&rarr;</span>
                                    <Badge color="grape"
                                           variant="light">{currentTranslation.targetPayloadTypes?.join(', ')}</Badge>
                                </Group>
                            )}
                        </Stack>
                    </Card>

                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Payloads</Text>
                        </Card.Section>

                        <Stack gap="sm" mt="md" style={{maxHeight: '240px', overflowY: 'auto', padding: '4px'}}>
                            {filteredPayloads.length === 0 ? (
                                <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '12px 0'}}>No
                                    compatible payloads.</Text>
                            ) : (
                                filteredPayloads.map(payload => {
                                    const checked = payloadIds.includes(payload.id);
                                    return (
                                        <Group
                                            key={payload.id}
                                            p="xs"
                                            style={{
                                                borderRadius: '4px',
                                                backgroundColor: checked ? 'rgba(28, 126, 214, 0.05)' : 'transparent',
                                                border: '1px solid rgba(255, 255, 255, 0.03)'
                                            }}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onChange={(e) => handlePayloadCheck(payload.id, e.currentTarget.checked)}
                                                label={
                                                    <Stack gap={0}>
                                                        <Text fw={600} size="sm">{payload.name}</Text>
                                                        <Text style={{fontFamily: 'monospace', fontSize: '11px'}}
                                                              c="dimmed">{payload.type}</Text>
                                                    </Stack>
                                                }
                                            />
                                        </Group>
                                    );
                                })
                            )}
                        </Stack>
                    </Card>

                    <Button
                        type="submit"
                        leftSection={<IconPlayerPlay size="1rem"/>}
                        loading={mutation.isPending}
                        disabled={!type}
                        size="md"
                        mt="md"
                    >
                        Start Translation
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
}
