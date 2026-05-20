package me.hsgamer.teststate.cms.core;

import lombok.Getter;
import me.hsgamer.teststate.uap.v1.TestState;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Getter
public class TestBatchSession {
    private final String batchId;
    private final String testName;
    private final TestTicket ticket;
    private final int totalIterations;
    private final List<BatchEntry> entries = new CopyOnWriteArrayList<>();
    private final List<Runnable> listeners = new CopyOnWriteArrayList<>();
    private final Instant createdAt;

    private Instant startedAt;
    private Instant completedAt;

    private volatile BatchStatus status = BatchStatus.PENDING;

    public TestBatchSession(String testName, TestTicket ticket, int totalIterations) {
        this.batchId = "BCH-" + UUID.randomUUID();
        this.testName = testName;
        this.ticket = ticket;
        this.totalIterations = totalIterations;
        this.createdAt = Instant.now();
    }

    public void setStatus(BatchStatus status) {
        this.status = status;
        if (status == BatchStatus.RUNNING && startedAt == null) {
            this.startedAt = Instant.now();
        } else if (status == BatchStatus.COMPLETED) {
            this.completedAt = Instant.now();
        }
    }

    public BatchEntry addEntry(String agentId) {
        BatchEntry entry = new BatchEntry(agentId);
        entries.add(entry);
        return entry;
    }

    public Optional<BatchEntry> pollPendingEntry() {
        return entries.stream()
            .filter(BatchEntry::isPending)
            .findFirst();
    }

    public void markEntryActive(BatchEntry entry, TestSession session) {
        entry.markActive(session);
        session.addStatusConsumer(s -> notifyListeners());
        session.onCompletion(this::checkCompletion);
        notifyListeners();
    }

    public void markEntryFailed(BatchEntry entry) {
        entry.markFailed();
        notifyListeners();
        checkCompletion();
    }

    public void addListener(Runnable listener) {
        listeners.add(listener);
    }

    private void notifyListeners() {
        listeners.forEach(Runnable::run);
    }

    private synchronized void checkCompletion() {
        if (status != BatchStatus.RUNNING) return;

        long done = entries.stream().filter(BatchEntry::isTerminallyComplete).count();
        if (done >= totalIterations) {
            setStatus(BatchStatus.COMPLETED);
        }

        notifyListeners();
    }

    public List<TestSession> getSessions() {
        return entries.stream()
            .map(BatchEntry::getSession)
            .filter(s -> s != null)
            .collect(java.util.stream.Collectors.toList());
    }

    public long getCompletedCount() {
        return entries.stream().filter(BatchEntry::isTerminallyComplete).count();
    }

    public long getPassedCount() {
        return entries.stream()
            .filter(e -> e.getSession() != null
                && e.getSession().getStatus() != null
                && e.getSession().getStatus().getState() == TestState.TEST_STATE_COMPLETED)
            .count();
    }

    public long getFailedCount() {
        return entries.stream()
            .filter(e -> e.getEntryStatus() == BatchEntry.EntryStatus.FAILED
                || (e.getSession() != null
                && e.getSession().getStatus() != null
                && e.getSession().getStatus().getState() == TestState.TEST_STATE_FAILED))
            .count();
    }

    public long getRunningCount() {
        return entries.stream()
            .filter(e -> e.getSession() != null
                && e.getSession().getStatus() != null
                && e.getSession().getStatus().getState() == TestState.TEST_STATE_RUNNING)
            .count();
    }

    public long getPendingCount() {
        return totalIterations - getCompletedCount() - getRunningCount();
    }

    public long getActiveEntryCount() {
        return entries.stream().filter(e -> !e.isTerminallyComplete()).count();
    }

    public boolean hasActiveEntry() {
        return entries.stream().anyMatch(e ->
            e.getEntryStatus() == BatchEntry.EntryStatus.REGISTERING
                || (e.getEntryStatus() == BatchEntry.EntryStatus.ACTIVE && !e.isTerminallyComplete()));
    }

    public double getThroughput() {
        long durationMs = getDuration();
        if (durationMs < 1000) return 0;
        return (getCompletedCount() * 60000.0) / durationMs;
    }

    public long getDuration() {
        if (startedAt == null) return 0;
        Instant end = completedAt != null ? completedAt : Instant.now();
        return Duration.between(startedAt, end).toMillis();
    }

    public double getAverageNegotiationDuration() {
        return entries.stream()
            .map(BatchEntry::getSession)
            .filter(s -> s != null && s.getNegotiationDurationMs() > 0)
            .mapToLong(TestSession::getNegotiationDurationMs)
            .average()
            .orElse(0);
    }

    public String getThroughputFormatted() {
        return String.format("%.2f", getThroughput());
    }

    public String getAverageNegotiationDurationFormatted() {
        return String.format("%.0f", getAverageNegotiationDuration());
    }
}
