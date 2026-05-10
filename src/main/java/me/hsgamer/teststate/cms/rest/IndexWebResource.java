package me.hsgamer.teststate.cms.rest;

import io.quarkus.qute.CheckedTemplate;
import io.quarkus.qute.TemplateInstance;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import me.hsgamer.teststate.cms.core.Agent;
import me.hsgamer.teststate.cms.core.TestBatchSession;
import me.hsgamer.teststate.cms.core.TestSession;
import me.hsgamer.teststate.cms.persistence.PayloadEntity;
import me.hsgamer.teststate.cms.persistence.TestEntity;
import me.hsgamer.teststate.cms.service.*;

import java.util.Collection;
import java.util.List;

@Path("/")
public class IndexWebResource {

    @Inject
    AgentManager agentManager;
    @Inject
    TestService testService;
    @Inject
    PayloadService payloadService;
    @Inject
    BatchTestManager batchTestManager;
    @Inject
    TestSessionManager testSessionManager;
    @Inject
    StatisticsService statisticsService;

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance get() {
        return Templates.index(
            agentManager.getAgents(),
            testService.listAll(),
            payloadService.listAll(),
            batchTestManager.getBatchSessions(),
            testSessionManager.getTestSessions(),
            String.format("%.2f", statisticsService.getAvgNegotiationTime()),
            String.format("%.2f", statisticsService.getThroughputPerMinute())
        );
    }

    @CheckedTemplate(basePath = "")
    public static class Templates {
        public static native TemplateInstance index(
            Collection<Agent> agents,
            List<TestEntity> tests,
            List<PayloadEntity> payloads,
            Collection<TestBatchSession> batches,
            Collection<TestSession> sessions,
            String avgNegotiationTime,
            String throughput
        );
    }
}
