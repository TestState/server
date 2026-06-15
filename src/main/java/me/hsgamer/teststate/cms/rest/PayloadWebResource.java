package me.hsgamer.teststate.cms.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import me.hsgamer.teststate.cms.persistence.PayloadEntity;
import me.hsgamer.teststate.cms.service.AgentManager;
import me.hsgamer.teststate.cms.service.PayloadService;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@Path("/api/payloads")
@Slf4j
public class PayloadWebResource {

    @Inject
    PayloadService payloadService;

    @Inject
    AgentManager agentManager;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<PayloadEntity> list() {
        return payloadService.listAll();
    }

    @GET
    @Path("/available-types")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<String> getAvailableTypes() {
        return agentManager.getAvailablePayloadTypes();
    }

    @GET
    @Path("/mime-mappings")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Set<String>> getMimeMappings() {
        return agentManager.getPayloadMimeTypeMapping();
    }

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public PayloadEntity getPayload(@PathParam("id") Long id) {
        return payloadService.findById(id)
            .orElseThrow(() -> new NotFoundException("Payload not found: " + id));
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response create(
        @RestForm("name") String name,
        @RestForm("description") String description,
        @RestForm("type") String type,
        @RestForm("metadata") String metadata,
        @RestForm("attachmentFile") FileUpload attachment) {

        PayloadEntity entity = buildEntity(name, description, type, metadata, attachment);
        if (entity == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Failed to build payload entity")).build();
        }

        PayloadEntity saved = payloadService.create(entity);
        return Response.status(Response.Status.CREATED).entity(saved).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response update(
        @PathParam("id") Long id,
        @RestForm("name") String name,
        @RestForm("description") String description,
        @RestForm("type") String type,
        @RestForm("metadata") String metadata,
        @RestForm("attachmentFile") FileUpload attachment) {

        PayloadEntity entity = buildEntity(name, description, type, metadata, attachment);
        if (entity == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Failed to build payload entity")).build();
        }

        PayloadEntity saved = payloadService.update(id, entity);
        return Response.ok(saved).build();
    }

    private PayloadEntity buildEntity(String name, String description, String type, String metadata, FileUpload attachment) {
        PayloadEntity entity = new PayloadEntity();
        entity.setName(name);
        entity.setDescription(description);
        entity.setType(type);
        entity.setMetadata(metadata);

        if (attachment != null && attachment.size() > 0) {
            String mimeType = attachment.contentType();
            Map<String, Set<String>> mapping = agentManager.getPayloadMimeTypeMapping();
            if (mapping.containsKey(type) && !mapping.get(type).isEmpty()) {
                if (!mapping.get(type).contains(mimeType)) {
                    log.warn("MIME type '{}' is not supported for payload type '{}' by any registered agents", mimeType, type);
                    return null;
                }
            }

            try {
                entity.setAttachmentName(attachment.fileName());
                entity.setAttachmentMimeType(mimeType);
                entity.setAttachmentData(Files.readAllBytes(attachment.filePath()));
            } catch (IOException e) {
                log.error("Failed to read uploaded file", e);
                return null;
            }
        }
        return entity;
    }

    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("id") Long id) {
        payloadService.delete(id);
        return Response.ok(Map.of("success", true)).build();
    }

    @GET
    @Path("/{id}/attachment")
    public Response downloadAttachment(@PathParam("id") Long id) {
        PayloadEntity entity = payloadService.findById(id)
            .orElseThrow(() -> new NotFoundException("Payload not found: " + id));

        if (entity.getAttachmentData() == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(entity.getAttachmentData())
            .type(entity.getAttachmentMimeType())
            .header("Content-Disposition", "attachment; filename=\"" + entity.getAttachmentName() + "\"")
            .build();
    }
}
