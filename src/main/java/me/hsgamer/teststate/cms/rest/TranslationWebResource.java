package me.hsgamer.teststate.cms.rest;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import me.hsgamer.teststate.cms.core.TranslationSession;
import me.hsgamer.teststate.cms.dto.AgentInfo;
import me.hsgamer.teststate.cms.persistence.PayloadEntity;
import me.hsgamer.teststate.cms.service.AgentManager;
import me.hsgamer.teststate.cms.service.PayloadService;
import me.hsgamer.teststate.cms.service.TranslationManager;
import me.hsgamer.teststate.uap.v1.Payload;

import java.util.*;

@Path("/api/translations")
@Slf4j
@ApplicationScoped
public class TranslationWebResource {

    @Inject
    PayloadService payloadService;

    @Inject
    TranslationManager translationManager;

    @GET
    @Path("/sessions")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public List<Map<String, Object>> list() {
        return translationManager.getTranslationSessions().stream()
            .map(this::sessionToMap)
            .toList();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartTranslationRequest {
        private String agentId;
        private String type;
        private List<Long> payloadIds;
    }

    @POST
    @Path("/sessions")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Uni<Response> start(StartTranslationRequest req) {
        List<Long> payloadIds = req.getPayloadIds();
        if (payloadIds == null || payloadIds.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "No source payloads selected"))
                .build());
        }

        List<Payload> sourcePayloads = payloadService.preparePayloads(payloadIds);

        return translationManager.startTranslation(req.getAgentId(), req.getType(), sourcePayloads)
            .map(result -> {
                if (result.accepted()) {
                    return Response.ok(Map.of("sessionId", result.session().getSessionId())).build();
                } else {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Agent rejected translation: " + result.reason()))
                        .build();
                }
            });
    }

    @GET
    @Path("/sessions/{sessionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Map<String, Object> status(@PathParam("sessionId") String sessionId) {
        TranslationSession session = translationManager.getTranslationSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Translation session not found: " + sessionId));

        List<GeneratedPayloadInfo> generatedItems = new ArrayList<>();
        List<Payload> payloads = session.getRawPayloads();
        for (int i = 0; i < payloads.size(); i++) {
            Payload p = payloads.get(i);
            String name = p.hasAttachment() ? p.getAttachment().getName() : "unnamed";
            var saved = payloadService.findByOrigin(sessionId, name);
            generatedItems.add(new GeneratedPayloadInfo(i, name, p.getType(), saved.map(e -> e.id).orElse(null)));
        }

        Map<String, Object> response = sessionToMap(session);
        response.put("generatedItems", generatedItems);
        return response;
    }

    @GET
    @Path("/sessions/{sessionId}/payloads/{index}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response download(@PathParam("sessionId") String sessionId, @PathParam("index") int index) {
        TranslationSession session = translationManager.getTranslationSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Session not found"));
        if (index < 0 || index >= session.getRawPayloads().size()) {
            throw new NotFoundException("Payload index out of range");
        }
        Payload payload = session.getRawPayloads().get(index);
        byte[] data = payload.getAttachment().getData().toByteArray();
        return Response.ok(data)
            .header("Content-Disposition", "attachment; filename=\"" + payload.getAttachment().getName() + "\"")
            .type(payload.getAttachment().getMimeType())
            .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavePayloadRequest {
        private String name;
        private String description;
    }

    @POST
    @Path("/sessions/{sessionId}/payloads/{index}/save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Response savePayload(
        @PathParam("sessionId") String sessionId,
        @PathParam("index") int index,
        SavePayloadRequest req) {
        
        TranslationSession session = translationManager.getTranslationSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Session not found"));
        if (index < 0 || index >= session.getRawPayloads().size()) {
            throw new NotFoundException("Payload index out of range");
        }
        Payload payload = session.getRawPayloads().get(index);
        payloadService.savePayload(sessionId, payload, req.getName(), req.getDescription());

        return Response.ok(Map.of("success", true)).build();
    }

    private Map<String, Object> sessionToMap(TranslationSession session) {
        Map<String, Object> m = new HashMap<>();
        m.put("sessionId", session.getSessionId());
        m.put("status", session.getStatus() != null ? session.getStatus().getState().name() : "PENDING");
        if (session.getStatus() != null && session.getStatus().getMessage() != null) {
            m.put("statusMessage", session.getStatus().getMessage());
        }
        m.put("payloadsCount", session.getRawPayloads().size());
        m.put("format", session.getTicket() != null ? session.getTicket().targetFormat() : "");
        return m;
    }

    public record GeneratedPayloadInfo(int index, String name, String type, Long databaseId) {
    }
}
