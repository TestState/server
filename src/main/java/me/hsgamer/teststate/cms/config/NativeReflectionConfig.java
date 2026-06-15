package me.hsgamer.teststate.cms.config;

import io.quarkus.runtime.annotations.RegisterForReflection;
import me.hsgamer.teststate.cms.core.TranslationSession;
import me.hsgamer.teststate.cms.websocket.TestWebSocket;
import me.hsgamer.teststate.cms.websocket.WSMessage;
import me.hsgamer.teststate.cms.rest.TranslationWebResource;

/**
 * Centralized reflection configuration for GraalVM Native Image.
 * This keeps the rest of the codebase clean of infrastructure-specific annotations.
 */
@RegisterForReflection(targets = {
    // WebSocket Messages
    WSMessage.class,
    WSMessage.TelemetryMsg.class,
    WSMessage.StatusMsg.class,
    WSMessage.ResultMsg.class,
    WSMessage.BatchUpdateMsg.class,
    WSMessage.SessionStatusDTO.class,

    // Test Results DTOs
    TestWebSocket.ResultDTO.class,
    TestWebSocket.StepReportDTO.class,
    TestWebSocket.StepSummaryDTO.class,
    TestWebSocket.ResultSummaryDTO.class,
    TestWebSocket.AttachmentDTO.class,

    // Translation Results DTOs
    TranslationSession.GeneratedPayload.class,
    TranslationWebResource.GeneratedPayloadInfo.class
})
public class NativeReflectionConfig {
}
