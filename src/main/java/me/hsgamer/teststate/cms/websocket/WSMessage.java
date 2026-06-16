package me.hsgamer.teststate.cms.websocket;

import me.hsgamer.teststate.uap.v1.Telemetry;
import me.hsgamer.teststate.uap.v1.TestStatus;
import me.hsgamer.teststate.uap.v1.TranslationStatus;

public class WSMessage {
    public record TelemetryMsg(String type, String level, String message, long timestamp) {
        public static TelemetryMsg from(Telemetry t) {
            return new TelemetryMsg("TELEMETRY", t.getSeverity().name(), t.getMessage(),
                t.getTimestamp().getSeconds() * 1000 + t.getTimestamp().getNanos() / 1000000);
        }
    }

    public record StatusMsg(String type, String state, String message) {
        public static StatusMsg from(String state, String message) {
            return new StatusMsg("STATUS", state, message);
        }

        public static StatusMsg from(TestStatus s) {
            return from(s.getState().name(), s.getMessage());
        }

        public static StatusMsg from(TranslationStatus s) {
            return from(s.getState().name(), s.getMessage());
        }
    }

    public record ResultMsg(String type, Object result) {
        public static ResultMsg from(Object result) {
            return new ResultMsg("RESULT", result);
        }
    }

    public record BatchUpdateMsg(String type, String batchId, String status, long completed, int totalIterations,
                                 long passedCount, long failedCount, long runningCount, long pendingCount,
                                 String throughput, String avgNegotiate,
                                 java.util.List<SessionStatusDTO> sessions) {
        public static BatchUpdateMsg from(me.hsgamer.teststate.cms.core.TestBatchSession batch) {
            return new BatchUpdateMsg("BATCH_UPDATE", batch.getBatchId(), batch.getStatus().name(),
                batch.getCompletedCount(), batch.getTotalIterations(),
                batch.getPassedCount(), batch.getFailedCount(), batch.getRunningCount(), batch.getPendingCount(),
                batch.getThroughputFormatted(), batch.getAverageNegotiationDurationFormatted(),
                batch.getSessions().stream().map(s -> new SessionStatusDTO(
                    s.getSessionId(),
                    s.getStatus() != null ? s.getStatus().getState().name() : "PENDING",
                    s.getStatus() != null ? s.getStatus().getMessage() : "Waiting...",
                    s.getAgentId(),
                    s.getAgentName(),
                    s.getNegotiationDurationMs(),
                    s.getStatus() != null && me.hsgamer.teststate.cms.util.StatusUtil.isTerminal(s.getStatus().getState())
                )).toList());
        }
    }

    public record SessionStatusDTO(String sessionId, String state, String message, String agentId, String agentName,
                                   long negotiationDurationMs, boolean terminal) {
    }
}
