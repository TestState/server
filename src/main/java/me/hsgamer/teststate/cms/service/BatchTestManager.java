package me.hsgamer.teststate.cms.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import me.hsgamer.teststate.cms.core.BatchEntry;
import me.hsgamer.teststate.cms.core.BatchStatus;
import me.hsgamer.teststate.cms.core.TestBatchSession;
import me.hsgamer.teststate.cms.core.TestTicket;
import me.hsgamer.teststate.cms.persistence.TestEntity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class BatchTestManager {
    private final Map<String, TestBatchSession> batchSessions = new ConcurrentHashMap<>();

    @Inject
    TestService testService;

    @Inject
    TestSessionManager testSessionManager;

    public Optional<TestBatchSession> getBatchSession(String id) {
        return Optional.ofNullable(batchSessions.get(id));
    }

    public Collection<TestBatchSession> getBatchSessions() {
        return Collections.unmodifiableCollection(batchSessions.values());
    }

    private void addBatchSession(TestBatchSession session) {
        batchSessions.put(session.getBatchId(), session);
    }

    public String startBatchTest(Long testId, List<String> agentIds, List<Long> extraPayloadIds, int iterations, boolean parallel) {
        TestEntity test = testService.findById(testId)
            .orElseThrow(() -> new IllegalArgumentException("Test not found: " + testId));

        TestTicket ticket = testSessionManager.prepareTicket(testId, extraPayloadIds);
        TestBatchSession batch = new TestBatchSession(test.getName(), ticket, agentIds.size() * iterations);
        addBatchSession(batch);

        for (int i = 0; i < iterations; i++) {
            agentIds.forEach(batch::addEntry);
        }

        batch.setStatus(BatchStatus.RUNNING);

        if (parallel) {
            batch.getEntries().forEach(entry -> register(batch, entry));
        } else {
            batch.addListener(() -> processNextSequential(batch));
            processNextSequential(batch);
        }

        return batch.getBatchId();
    }

    private synchronized void processNextSequential(TestBatchSession batch) {
        if (batch.getStatus() != BatchStatus.RUNNING) return;
        if (batch.hasActiveEntry()) return;

        batch.pollPendingEntry().ifPresent(entry -> {
            entry.markRegistering();
            register(batch, entry);
        });
    }

    private void register(TestBatchSession batch, BatchEntry entry) {
        testSessionManager.startTest(entry.getAgentId(), batch.getTicket()).subscribe().with(
            res -> {
                if (res.accepted()) {
                    batch.markEntryActive(entry, res.session());
                } else {
                    batch.markEntryFailed(entry);
                }
            },
            err -> batch.markEntryFailed(entry)
        );
    }
}
