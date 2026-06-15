import React, {useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {safeFetch} from '../utils/safeFetch';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Badge,
    Button,
    Card,
    Center,
    Checkbox,
    Group,
    Loader,
    NumberInput,
    Radio,
    Stack,
    Text,
    Title
} from '@mantine/core';
import {IconArrowLeft, IconPlayerPlay} from '@tabler/icons-react';

function TestRunInner({id, test, agents, extraPayloads}) {
    const navigate = useNavigate();

    const [agentIds, setAgentIds] = useState([]);
    const [extraPayloadIds, setExtraPayloadIds] = useState([]);
    const [iterations, setIterations] = useState(1);
    const [strategy, setStrategy] = useState('sequential');
    const [errorMsg, setErrorMsg] = useState(null);

    const runMutation = useMutation({
        mutationFn: (body) => safeFetch(`/api/tests/${id}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }),
        onSuccess: (res) => {
            if (res.batchId) {
                navigate(`/tests/batch/${res.batchId}/status`);
            } else if (res.sessionId) {
                navigate(`/tests/session/${res.sessionId}/status`);
            }
        },
        onError: (err) => {
            setErrorMsg('Failed to trigger run: ' + err.message);
        }
    });

    const getPayloadRequirement = (payloadType) => {
        if (!agents || !test) return null;
        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
        agents.forEach(agent => {
            if (agentIds.length > 0 && !agentIds.includes(agent.id)) return;

            const st = agent.supportedTests?.find(tt => tt.testType === test.testType);
            if (st) {
                st.requiredPayloadTypes?.forEach(r => requirements.set(r, 'REQUIRED'));
                st.optionalPayloadTypes?.forEach(o => {
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

        if (agentIds.length === 0) {
            setErrorMsg('Please select at least one agent node.');
            return;
        }

        runMutation.mutate({
            agentIds,
            extraPayloadIds,
            iterations: parseInt(iterations) || 1,
            parallel: strategy === 'parallel'
        });
    };

    const handleAgentCheck = (agentId, checked) => {
        if (checked) {
            setAgentIds(prev => [...prev, agentId]);
        } else {
            setAgentIds(prev => prev.filter(id => id !== agentId));
        }
    };

    const handleExtraCheck = (extraId, checked) => {
        if (checked) {
            setExtraPayloadIds(prev => [...prev, extraId]);
        } else {
            setExtraPayloadIds(prev => prev.filter(id => id !== extraId));
        }
    };

    return (
        <Stack gap="xl" w="100%">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Stack gap={0}>
                    <Title order={2}>Run Test</Title>
                    <Text size="xs" style={{fontFamily: 'monospace'}} c="dimmed">{test.name}</Text>
                </Stack>
                <Button variant="light" leftSection={<IconArrowLeft size="1rem"/>} onClick={() => navigate('/tests')}>
                    Return
                </Button>
            </Group>

            {errorMsg && (
                <Alert title="Execution Failed" color="red" withCloseButton onClose={() => setErrorMsg(null)}>
                    {errorMsg}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {/* Nodes Selection */}
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Nodes</Text>
                        </Card.Section>

                        <Stack gap="sm" mt="md" style={{maxHeight: '200px', overflowY: 'auto', padding: '4px'}}>
                            {agents.length === 0 ? (
                                <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '12px 0'}}>No active
                                    agents.</Text>
                            ) : (
                                agents.map(agent => {
                                    const supportsType = agent.supportedTestTypes?.includes(test.testType);
                                    const checked = agentIds.includes(agent.id);
                                    return (
                                        <Group
                                            key={agent.id}
                                            justify="space-between"
                                            align="center"
                                            p="xs"
                                            style={{
                                                borderRadius: '4px',
                                                backgroundColor: checked ? 'rgba(28, 126, 214, 0.05)' : 'transparent',
                                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                                opacity: supportsType ? 1 : 0.5
                                            }}
                                        >
                                            <Checkbox
                                                disabled={!supportsType}
                                                checked={checked}
                                                onChange={(e) => handleAgentCheck(agent.id, e.currentTarget.checked)}
                                                label={
                                                    <Stack gap={0}>
                                                        <Text fw={600} size="sm">{agent.name}</Text>
                                                        <Text style={{fontFamily: 'monospace', fontSize: '11px'}}
                                                              c="dimmed">{agent.id}</Text>
                                                    </Stack>
                                                }
                                            />
                                            <Badge color={supportsType ? 'green' : 'red'} variant="light">
                                                {supportsType ? 'Ready' : 'Incompatible'}
                                            </Badge>
                                        </Group>
                                    );
                                })
                            )}
                        </Stack>
                    </Card>

                    {/* Settings */}
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Settings</Text>
                        </Card.Section>

                        <Stack gap="md" mt="md">
                            <NumberInput
                                label="Iterations"
                                min={1}
                                max={1000}
                                required
                                value={iterations}
                                onChange={setIterations}
                            />

                            <Radio.Group
                                label="Strategy"
                                value={strategy}
                                onChange={setStrategy}
                            >
                                <Group mt="xs">
                                    <Radio value="sequential" label="Sequential"/>
                                    <Radio value="parallel" label="Parallel"/>
                                </Group>
                            </Radio.Group>
                        </Stack>
                    </Card>

                    {/* Linked Payloads */}
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Payloads</Text>
                        </Card.Section>

                        <Stack gap="xs" mt="md" style={{maxHeight: '200px', overflowY: 'auto', padding: '4px'}}>
                            {(!test.payloads || test.payloads.length === 0) ? (
                                <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '12px 0'}}>No linked
                                    payloads.</Text>
                            ) : (
                                test.payloads.map(payload => (
                                    <Group
                                        key={payload.id}
                                        justify="space-between"
                                        align="center"
                                        p="xs"
                                        style={{
                                            borderRadius: '4px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}
                                    >
                                        <Text fw={600} size="sm">{payload.name}</Text>
                                        <Badge color="orange" variant="light"
                                               style={{fontFamily: 'monospace'}}>{payload.type}</Badge>
                                    </Group>
                                ))
                            )}
                        </Stack>
                    </Card>

                    {/* Extra Payloads */}
                    <Card withBorder shadow="sm" radius="md" p="md">
                        <Card.Section withBorder inheritPadding py="xs">
                            <Text fw={600}>Extras</Text>
                        </Card.Section>

                        <Stack gap="sm" mt="md" style={{maxHeight: '200px', overflowY: 'auto', padding: '4px'}}>
                            {extraPayloads.length === 0 ? (
                                <Text size="sm" c="dimmed" style={{textAlign: 'center', padding: '12px 0'}}>No
                                    compatible extras available.</Text>
                            ) : (
                                extraPayloads.map(payload => {
                                    const reqState = getPayloadRequirement(payload.type);
                                    const checked = extraPayloadIds.includes(payload.id);
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
                                                onChange={(e) => handleExtraCheck(payload.id, e.currentTarget.checked)}
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
                        leftSection={<IconPlayerPlay size="1rem"/>}
                        loading={runMutation.isPending}
                        size="md"
                        mt="md"
                    >
                        Start Run
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
}

export default function TestRun() {
    const {id} = useParams();

    const {data, isPending: loading, error} = useQuery({
        queryKey: ['test-run-context', id],
        queryFn: async () => {
            const [test, agents, payloads] = await Promise.all([
                safeFetch(`/api/tests/${id}`),
                safeFetch('/api/agents'),
                safeFetch('/api/payloads')
            ]);

            const compatibleTypes = new Set();
            agents.forEach(agent => {
                const t = agent.supportedTests?.find(st => st.testType === test.testType);
                if (t) {
                    t.requiredPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
                    t.optionalPayloadTypes?.forEach(pt => compatibleTypes.add(pt));
                }
            });

            const linkedIds = new Set(test.payloads?.map(p => p.id) || []);
            const extraPayloads = payloads.filter(p => !linkedIds.has(p.id) && compatibleTypes.has(p.type));

            return {test, agents, extraPayloads};
        }
    });

    if (loading) {
        return (
            <Center style={{height: '50vh'}}>
                <Stack align="center" gap="sm">
                    <Loader size="md"/>
                    <Text size="sm" c="dimmed">Loading Run context...</Text>
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
            <TestRunInner
                id={id}
                test={data.test}
                agents={data.agents}
                extraPayloads={data.extraPayloads}
            />
        </div>
    );
}
