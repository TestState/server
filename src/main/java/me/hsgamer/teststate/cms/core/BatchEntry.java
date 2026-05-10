package me.hsgamer.teststate.cms.core;

import lombok.Getter;

@Getter
public class BatchEntry {
    private final String agentId;
    private volatile EntryStatus entryStatus = EntryStatus.PENDING;
    private volatile TestSession session;
    public BatchEntry(String agentId) {
        this.agentId = agentId;
    }

    public void markRegistering() {
        this.entryStatus = EntryStatus.REGISTERING;
    }

    void markActive(TestSession session) {
        this.session = session;
        this.entryStatus = EntryStatus.ACTIVE;
    }

    void markFailed() {
        this.entryStatus = EntryStatus.FAILED;
    }

    boolean isPending() {
        return entryStatus == EntryStatus.PENDING;
    }

    public boolean isTerminallyComplete() {
        if (entryStatus == EntryStatus.FAILED) return true;
        if (session == null) return false;
        return session.getStatus() != null && me.hsgamer.teststate.cms.util.StatusUtil.isTerminal(session.getStatus().getState());
    }

    public enum EntryStatus {
        PENDING,
        REGISTERING,
        ACTIVE,
        FAILED
    }
}
