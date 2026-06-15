package me.hsgamer.teststate.cms.rest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import me.hsgamer.teststate.cms.dto.TestTypeInfo;
import me.hsgamer.teststate.cms.dto.TranslationTypeInfo;
import me.hsgamer.teststate.cms.service.AgentManager;
import me.hsgamer.teststate.uap.v1.Capability;
import me.hsgamer.teststate.uap.v1.PayloadRequirement;

import java.util.List;

@Path("/api/agents")
@ApplicationScoped
public class AgentWebResource {

    @Inject
    AgentManager agentManager;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentResponse {
        private String id;
        private String name;
        private List<String> capabilities;
        private List<String> supportedTestTypes;
        private List<TestTypeInfo> supportedTests;
        private List<TranslationTypeInfo> supportedTranslations;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<AgentResponse> list() {
        return agentManager.getAgents().stream().map(a -> {
            List<String> capabilities = a.capabilities().stream().map(c -> {
                if (c.hasTest()) return c.getTest().getType();
                if (c.hasTranslation()) return c.getTranslation().getType();
                return "UNKNOWN";
            }).toList();

            List<String> supportedTestTypes = a.capabilities().stream()
                .filter(Capability::hasTest)
                .map(c -> c.getTest().getType())
                .toList();

            List<TestTypeInfo> supportedTests = a.capabilities().stream()
                .filter(Capability::hasTest)
                .map(c -> {
                    var t = c.getTest();
                    var req = t.getPayloadsList().stream().filter(PayloadRequirement::getIsRequired).map(PayloadRequirement::getType).toList();
                    var opt = t.getPayloadsList().stream().filter(p -> !p.getIsRequired()).map(PayloadRequirement::getType).toList();
                    return new TestTypeInfo(t.getType(), req, opt);
                }).toList();

            List<TranslationTypeInfo> supportedTranslations = a.capabilities().stream()
                .filter(Capability::hasTranslation)
                .map(c -> {
                    var t = c.getTranslation();
                    var src = t.getSourcePayloadsList().stream().map(p -> p.getType()).toList();
                    var trg = t.getTargetPayloadsList().stream().map(p -> p.getType()).toList();
                    return new TranslationTypeInfo(t.getType(), src, trg);
                }).toList();

            return new AgentResponse(a.id(), a.displayName(), capabilities, supportedTestTypes, supportedTests, supportedTranslations);
        }).toList();
    }
}
