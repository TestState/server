package me.hsgamer.teststate.cms.rest;

import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import me.hsgamer.teststate.cms.service.AgentManager;
import me.hsgamer.teststate.cms.service.BatchTestManager;
import me.hsgamer.teststate.cms.service.PayloadService;
import me.hsgamer.teststate.cms.service.StatisticsService;
import me.hsgamer.teststate.cms.service.TestService;
import me.hsgamer.teststate.cms.service.TestSessionManager;

@Path("/")
public class IndexWebResource {

    @Inject
    Template index;

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
        return index.data("agents", agentManager.getAgents())
                    .data("tests", testService.listAll())
                    .data("payloads", payloadService.listAll())
                    .data("batches", batchTestManager.getBatchSessions())
                    .data("sessions", testSessionManager.getTestSessions())
                    .data("avgNegotiationTime", String.format("%.2f", statisticsService.getAvgNegotiationTime()))
                    .data("throughput", String.format("%.2f", statisticsService.getThroughputPerMinute()));
    }
}
