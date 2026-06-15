import React, {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Autocomplete,
    Badge,
    Button,
    Card,
    Center,
    Checkbox,
    Group,
    Loader,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconCopy, IconDeviceFloppy} from '@tabler/icons-react';

function TestFormInner({isEdit, id, availableTypes, allPayloads, entity, agents}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [testType, setTestType] = useState('');
    const [payloadIds, setPayloadIds] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    const saveMutation = useMutation({
        mutationFn: (body) => {
            const url = isEdit ? `/api/tests/${id}` : '/api/tests';
            const method = isEdit ? 'PUT' : 'POST';
            return safeFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tests-data']});
            navigate('/tests');
        },
        onError: (err) => {
            setErrorMsg(err.message);
        }
    });

    const copyMutation = useMutation({
        mutationFn: () => safeFetch(`/api/tests/${id}/copy`, {method: 'POST'}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tests-data']});
            navigate('/tests');
        },
        onError: (err) => {
            alert('Failed to duplicate test: ' + err.message);
        }
    });

    useEffect(() => {
        if (entity) {
            setName(entity.name || '');
            setDescription(entity.description || '');
            setTestType(entity.testType || '');
            setPayloadIds(entity.payloads?.map(p => p.id) || []);
        } else if (availableTypes.length > 0 && !testType) {
            setTestType(availableTypes[0]);
        }
    }, [entity, availableTypes]);

    const getPayloadRequirement = (payloadType) => {
        if (!testType || !agents) return null;
        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
        agents.forEach(agent => {
            const test = agent.supportedTests?.find(t => t.testType === testType);
            if (test) {
                test.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
                test.optionalPayloadTypes?.forEach(o => {
                    if (requirements.get(o) !== 'REQUIRED') {
                        requirements.set(o, 'RECOMMENDED');
                    }
                });
            }
        });
        return requirements.get(payloadType) || null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name) {
            setErrorMsg("Name is required");
            return;
        }
        if (!testType) {
            setErrorMsg("Type is required");
            return;
        }

        saveMutation.mutate({
            name,
            description,
            testType,
            payloadIds
        });
    };

    const handleCheck = (payloadId, checked) => {
        if (checked) {
            setPayloadIds(prev => [...prev, payloadId]);
        } else {
            setPayloadIds(prev => prev.filter(val => val !== payloadId));
        }
    };

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Title order={2}>{isEdit ? 'Edit Test' : 'New Test'}</Title>
                <Group gap="sm">
                    {isEdit && (
                        <Button
                            variant="light"
                            color="gray"
                            leftSection={<IconCopy size="1rem"/>}
                            onClick={() => copyMutation.mutate()}
                            loading={copyMutation.isPending}
                        >
                            Copy
                        </Button>
                    )}
                    <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>}
                            onClick={() => navigate('/tests')}>
                        Return
                    </Button>
                </Group>
            </Group>

            {errorMsg && (
                <Alert title="Error" color="red" withCloseButton onClose={() => setErrorMsg(null)}>
                    {errorMsg}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Settings</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            <TextInput
                                label="Name"
                                placeholder="Enter test name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <Autocomplete
                                label="Type"
                                placeholder="Select or enter test type"
                                required
                                data={availableTypes}
                                value={testType}
                                onChange={setTestType}
                            />
                        </Stack>
                    </Card>

                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Payloads</Text>
                        </Card.Section>

                        <Stack gap="sm" mt="md" style={{maxHeight: '240px', overflowY: 'auto', padding: '4px'}}>
                            {allPayloads.length === 0 ? (
                                <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '12px 0'}}>
                                    Empty. <Button variant="link" size="xs"
                                                   onClick={() => navigate('/payloads/new')}>New.</Button>
                                </Text>
                            ) : (
                                allPayloads.map(payload => {
                                    const reqState = getPayloadRequirement(payload.type);
                                    const checked = payloadIds.includes(payload.id);
                                    return (
                                        <Group
                                            key={payload.id}
                                            justify="space-between"
                                            align="center"
                                            p="xs"
                                            style={{
                                                borderRadius: '4px',
                                                backgroundColor: checked ? 'rgba(28, 126, 214, 0.05)' : 'transparent',
                                                border: '1px solid rgba(255, 255, 255, 0.03)'
                                            }}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onChange={(e) => handleCheck(payload.id, e.currentTarget.checked)}
                                                label={
                                                    <Stack gap={0}>
                                                        <Text fw={600} size="sm">{payload.name}</Text>
                                                        <Text style={{fontFamily: 'monospace', fontSize: '11px'}}
                                                              c="dimmed">{payload.type}</Text>
                                                    </Stack>
                                                }
                                            />
                                            {reqState && (
                                                <Badge color={reqState === 'REQUIRED' ? 'red' : 'green'} size="xs">
                                                    {reqState}
                                                </Badge>
                                            )}
                                        </Group>
                                    );
                                })
                            )}
                        </Stack>
                    </Card>

                    <Button
                        type="submit"
                        leftSection={<IconDeviceFloppy size="1rem"/>}
                        loading={saveMutation.isPending}
                        size="md"
                        mt="md"
                    >
                        Save
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
}

export default function TestForm() {
    const {id} = useParams();
    const isEdit = !!id;

    const {data, isPending: loading, error} = useQuery({
        queryKey: ['test-form-context', id],
        queryFn: async () => {
            const [types, payloads, entity, agents] = await Promise.all([
                safeFetch('/api/tests/available-types'),
                safeFetch('/api/payloads'),
                isEdit ? safeFetch(`/api/tests/${id}`) : Promise.resolve(null),
                safeFetch('/api/agents')
            ]);
            return {types, payloads, entity, agents};
        }
    });

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading Form data...</Text>
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
        <div style={{maxWidth: 800, margin: '0 auto', width: '100%'}}>
            <TestFormInner
                isEdit={isEdit}
                id={id}
                availableTypes={data.types}
                allPayloads={data.payloads}
                entity={data.entity}
                agents={data.agents}
            />
        </div>
    );
}
