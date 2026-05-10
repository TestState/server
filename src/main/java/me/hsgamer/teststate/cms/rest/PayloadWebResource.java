package me.hsgamer.teststate.cms.rest;

import io.quarkus.qute.CheckedTemplate;
import io.quarkus.qute.TemplateData;
import io.quarkus.qute.TemplateInstance;
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
import java.net.URI;
import java.nio.file.Files;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;


@Path("/payloads")
@Slf4j
public class PayloadWebResource {

    @Inject
    PayloadService payloadService;

    @Inject
    AgentManager agentManager;

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance list() {
        return Templates.payloads_list(payloadService.listAll());
    }

    @GET
    @Path("/new")
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance createForm() {
        return Templates.payloads_edit(
            new PayloadEntity(),
            agentManager.getAvailablePayloadTypes(),
            agentManager.getPayloadMimeTypeMapping()
        );
    }

    @GET
    @Path("/{id}/edit")
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance editForm(@PathParam("id") Long id) {
        PayloadEntity entity = payloadService.findById(id)
            .orElseThrow(() -> new NotFoundException("Payload not found: " + id));
        return Templates.payloads_edit(
            entity,
            agentManager.getAvailablePayloadTypes(),
            agentManager.getPayloadMimeTypeMapping()
        );
    }

    @POST
    @Path("/save")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response save(
        @RestForm("id") Long id,
        @RestForm("name") String name,
        @RestForm("description") String description,
        @RestForm("type") String type,
        @RestForm("metadata") String metadata,
        @RestForm("attachmentFile") FileUpload attachment) {

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
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Unsupported file type: " + mimeType + " for protocol " + type + ". Expected: " + mapping.get(type))
                        .build();
                }
            }

            try {
                entity.setAttachmentName(attachment.fileName());
                entity.setAttachmentMimeType(mimeType);
                entity.setAttachmentData(Files.readAllBytes(attachment.filePath()));
            } catch (IOException e) {
                log.error("Failed to read uploaded file", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Failed to upload attachment").build();
            }
        }


        if (id != null) {
            payloadService.update(id, entity);
        } else {
            payloadService.create(entity);
        }

        return Response.seeOther(URI.create("/payloads")).build();
    }

    @POST
    @Path("/{id}/delete")
    public Response delete(@PathParam("id") Long id) {
        payloadService.delete(id);
        return Response.seeOther(URI.create("/payloads")).build();
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

    @CheckedTemplate(basePath = "")
    public static class Templates {
        public static native TemplateInstance payloads_list(List<PayloadEntity> payloads);

        public static native TemplateInstance payloads_edit(PayloadEntity payload, Collection<String> availableTypes, Map<String, Set<String>> mimeTypeMapping);
    }
}
