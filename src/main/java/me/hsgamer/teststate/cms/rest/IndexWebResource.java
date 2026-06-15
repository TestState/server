package me.hsgamer.teststate.cms.rest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import me.hsgamer.teststate.cms.service.StatisticsService;

import java.util.HashMap;
import java.util.Map;

@Path("/api/statistics")
@ApplicationScoped
public class IndexWebResource {

    @Inject
    StatisticsService statisticsService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> get() {
        Map<String, Object> data = new HashMap<>();
        data.put("avgNegotiationTime", String.format("%.2f", statisticsService.getAvgNegotiationTime()));
        data.put("throughput", String.format("%.2f", statisticsService.getThroughputPerMinute()));
        return data;
    }
}
