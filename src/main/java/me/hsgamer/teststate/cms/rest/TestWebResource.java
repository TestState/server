package me.hsgamer.teststate.cms.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import me.hsgamer.teststate.cms.core.BatchStatus;
import me.hsgamer.teststate.cms.core.TestBatchSession;
import me.hsgamer.teststate.cms.core.TestSession;
import me.hsgamer.teststate.cms.dto.AgentInfo;
import me.hsgamer.teststate.cms.persistence.PayloadEntity;
import me.hsgamer.teststate.cms.persistence.TestEntity;
import me.hsgamer.teststate.cms.service.*;
import me.hsgamer.teststate.cms.util.ProtoUtil;
import me.hsgamer.teststate.cms.util.StatusUtil;
import me.hsgamer.teststate.uap.v1.Attachment;
import me.hsgamer.teststate.uap.v1.TestResult;

import java.util.*;

@Path("/api/tests")
@Slf4j
public class TestWebResource {

    @Inject
    TestService testService;

    @Inject
    PayloadService payloadService;

    @Inject
    AgentManager agentManager;

    @Inject
    TestSessionManager testSessionManager;

    @Inject
    BatchTestManager batchTestManager;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public List<TestEntity> list() {
        return testService.listAll();
    }

    @GET
    @Path("/sessions")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public List<Map<String, Object>> listSessions() {
        return testSessionManager.getTestSessions().stream()
            .map(s -> resultToMap(s, false))
            .toList();
    }

    @GET
    @Path("/batches")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public List<Map<String, Object>> listBatches() {
        return batchTestManager.getBatchSessions().stream()
            .map(batch -> {
                Map<String, Object> b = new HashMap<>();
                b.put("batchId", batch.getBatchId());
                b.put("testName", batch.getTestName());
                b.put("status", batch.getStatus());
                b.put("totalIterations", batch.getTotalIterations());
                b.put("completedCount", batch.getCompletedCount());
                b.put("duration", batch.getDuration());
                b.put("throughput", batch.getThroughput());
                return b;
            }).toList();
    }

    @GET
    @Path("/available-types")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<String> getAvailableTypes() {
        return agentManager.getAvailableTestTypes();
    }

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public TestEntity getTest(@PathParam("id") Long id) {
        return testService.findById(id)
            .orElseThrow(() -> new NotFoundException("Test not found: " + id));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveTestRequest {
        private String name;
        private String description;
        private String testType;
        private List<Long> payloadIds;
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response create(SaveTestRequest req) {
        TestEntity entity = new TestEntity();
        entity.setName(req.getName());
        entity.setDescription(req.getDescription());
        entity.setTestType(req.getTestType());

        TestEntity saved = testService.create(entity, req.getPayloadIds());
        return Response.status(Response.Status.CREATED).entity(saved).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response update(@PathParam("id") Long id, SaveTestRequest req) {
        TestEntity entity = new TestEntity();
        entity.setName(req.getName());
        entity.setDescription(req.getDescription());
        entity.setTestType(req.getTestType());

        TestEntity saved = testService.update(id, entity, req.getPayloadIds());
        return Response.ok(saved).build();
    }

    @POST
    @Path("/{id}/copy")
    @Produces(MediaType.APPLICATION_JSON)
    public Response copy(@PathParam("id") Long id) {
        TestEntity copy = testService.copy(id);
        return Response.ok(copy).build();
    }

    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("id") Long id) {
        testService.delete(id);
        return Response.ok(Map.of("success", true)).build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartTestRequest {
        private List<String> agentIds;
        private List<Long> extraPayloadIds;
        private int iterations = 1;
        private boolean parallel = false;
    }

    @POST
    @Path("/{id}/runs")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Uni<Response> start(@PathParam("id") Long id, StartTestRequest req) {
        List<String> agentIds = req.getAgentIds();
        List<Long> extraPayloadIds = req.getExtraPayloadIds() != null ? req.getExtraPayloadIds() : Collections.emptyList();
        int iterations = req.getIterations();
        boolean parallel = req.isParallel();

        if (agentIds == null || agentIds.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "No agents selected")).build());
        }

        if (iterations > 1 || agentIds.size() > 1) {
            String batchId = batchTestManager.startBatchTest(id, agentIds, extraPayloadIds, iterations, parallel);
            return Uni.createFrom().item(Response.ok(Map.of("batchId", batchId)).build());
        }

        String agentId = agentIds.get(0);
        return testSessionManager.startTest(id, agentId, extraPayloadIds)
            .map(result -> {
                if (result.accepted()) {
                    return Response.ok(Map.of("sessionId", result.session().getSessionId())).build();
                } else {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Agent rejected test: " + result.reason()))
                        .build();
                }
            });
    }

    @GET
    @Path("/sessions/{sessionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Map<String, Object> status(@PathParam("sessionId") String sessionId) {
        TestSession session = testSessionManager.getTestSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Test session not found: " + sessionId));

        return resultToMap(session, true);
    }

    @GET
    @Path("/batches/{batchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Map<String, Object> batchStatus(@PathParam("batchId") String batchId) {
        TestBatchSession batch = batchTestManager.getBatchSession(batchId)
            .orElseThrow(() -> new NotFoundException("Batch not found: " + batchId));

        Map<String, Object> report = new HashMap<>();
        report.put("batchId", batch.getBatchId());
        report.put("testName", batch.getTestName());
        report.put("status", batch.getStatus());
        report.put("iterations", batch.getTotalIterations());
        report.put("completed", batch.getCompletedCount());
        report.put("throughput", batch.getThroughput());
        report.put("duration",  batch.getDuration());
        report.put("averageNegotiationDuration", batch.getAverageNegotiationDuration());
        report.put("terminal", StatusUtil.isTerminal(batch.getStatus()));

        var results = batch.getSessions().stream().map(s -> resultToMap(s, false)).toList();
        report.put("sessions", results);

        return report;
    }

    @POST
    @Path("/batches/{batchId}/cancel")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Response cancelBatch(@PathParam("batchId") String batchId) {
        batchTestManager.getBatchSession(batchId).ifPresent(batch -> {
            if (batch.getStatus() == BatchStatus.PENDING || batch.getStatus() == BatchStatus.RUNNING) {
                batch.setStatus(BatchStatus.CANCELLED);
            }
        });
        return Response.ok(Map.of("success", true)).build();
    }

    private Map<String, Object> resultToMap(TestSession session, boolean full) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("agentId", session.getAgentId());
        entry.put("agentName", session.getAgentName());
        entry.put("sessionId", session.getSessionId());
        entry.put("negotiationDurationMs", session.getNegotiationDurationMs());
        entry.put("status", session.getStatus() != null ? session.getStatus().getState().name() : "PENDING");
        entry.put("terminal", session.getStatus() != null && StatusUtil.isTerminal(session.getStatus().getState()));
        if (session.getStatus() != null && session.getStatus().getMessage() != null) {
            entry.put("statusMessage", session.getStatus().getMessage());
        }
        if (session.getResult() != null) {
            try {
                var sessionResult = session.getResult();
                if (!full) {
                    var builder = sessionResult.toBuilder();
                    for (int i = 0; i < builder.getAttachmentsCount(); i++) {
                        builder.getAttachmentsBuilder(i).clearData();
                    }
                    sessionResult = builder.build();
                }
                entry.put("result", new ObjectMapper().readTree(ProtoUtil.toJson(sessionResult)));
            } catch (Exception e) {
                entry.put("result", null);
            }
        }
        if (!session.getTelemetryHistory().isEmpty()) {
            entry.put("logs", session.getTelemetryHistory().stream()
                .map(t -> Map.of(
                    "type", "TELEMETRY",
                    "level", t.getSeverity().name(),
                    "message", t.getMessage(),
                    "timestamp", t.getTimestamp().getSeconds() * 1000 + t.getTimestamp().getNanos() / 1000000
                ))
                .toList());
        }
        return entry;
    }

    @GET
    @Path("/sessions/{sessionId}/report")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Response downloadReport(@PathParam("sessionId") String sessionId, @QueryParam("full") @DefaultValue("false") boolean full) {
        TestSession session = testSessionManager.getTestSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Test session not found: " + sessionId));

        var report = resultToMap(session, full);
        return Response.ok(report)
            .header("Content-Disposition", "attachment; filename=\"report-" + (full ? "full-" : "") + sessionId + ".json\"")
            .build();
    }

    @GET
    @Path("/batches/{batchId}/report")
    @Produces(MediaType.APPLICATION_JSON)
    @Blocking
    public Response downloadBatchReport(@PathParam("batchId") String batchId, @QueryParam("full") @DefaultValue("false") boolean full) {
        TestBatchSession batch = batchTestManager.getBatchSession(batchId)
            .orElseThrow(() -> new NotFoundException("Batch not found: " + batchId));

        Map<String, Object> report = new HashMap<>();
        report.put("batchId", batch.getBatchId());
        report.put("testName", batch.getTestName());
        report.put("status", batch.getStatus());
        report.put("iterations", batch.getTotalIterations());
        report.put("completed", batch.getCompletedCount());
        report.put("throughput", batch.getThroughput());
        report.put("duration",  batch.getDuration());
        report.put("averageNegotiationDuration", batch.getAverageNegotiationDuration());

        var results = batch.getSessions().stream().map(s -> resultToMap(s, full)).toList();
        report.put("sessions", results);

        return Response.ok(report)
            .header("Content-Disposition", "attachment; filename=\"batch-report-" + (full ? "full-" : "") + batchId + ".json\"")
            .build();
    }

    @GET
    @Path("/sessions/{sessionId}/attachments/{index}")
    @Blocking
    public Response getAttachment(@PathParam("sessionId") String sessionId, @PathParam("index") int index) {
        TestSession session = testSessionManager.getTestSession(sessionId)
            .orElseThrow(() -> new NotFoundException("Test session not found: " + sessionId));

        TestResult result = session.getResult();
        if (result == null || index < 0 || index >= result.getAttachmentsCount()) {
            throw new NotFoundException("Attachment not found");
        }

        Attachment attachment = result.getAttachments(index);
        return Response.ok(attachment.getData().toByteArray())
            .type(attachment.getMimeType())
            .header("Content-Disposition", "attachment; filename=\"" + attachment.getName() + "\"")
            .build();
    }
}
