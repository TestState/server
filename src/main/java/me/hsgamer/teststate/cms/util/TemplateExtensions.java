package me.hsgamer.teststate.cms.util;

import io.quarkus.qute.TemplateExtension;
import me.hsgamer.teststate.cms.dto.AgentInfo;
import me.hsgamer.teststate.uap.v1.Attachment;
import me.hsgamer.teststate.uap.v1.Payload;
import me.hsgamer.teststate.uap.v1.TestState;
import me.hsgamer.teststate.uap.v1.TranslationState;

import java.util.Collection;

@TemplateExtension
public class TemplateExtensions {

    /**
     * Converts an enum name to lowercase for CSS classes.
     */
    public static String statusClass(Enum<?> e) {
        return e.name().toLowerCase();
    }

    /**
     * Cleans up the Protobuf TestState enum name for display and CSS.
     */
    public static String displayState(TestState state) {
        return state.name().replace("TEST_STATE_", "");
    }

    public static String stateClass(TestState state) {
        return state.name().toLowerCase().replace("test_state_", "");
    }

    /**
     * Cleans up the Protobuf TranslationState enum name for display and CSS.
     */
    public static String displayState(TranslationState state) {
        return state.name().replace("TRANSLATION_STATE_", "");
    }

    public static String stateClass(TranslationState state) {
        return state.name().toLowerCase().replace("translation_state_", "");
    }

    /**
     * Helper to access Protobuf Attachment properties without reflection.
     */
    public static String name(Attachment attachment) {
        return attachment.getName();
    }

    public static String mimeType(Attachment attachment) {
        return attachment.getMimeType();
    }

    /**
     * Helper to access Protobuf Payload properties without reflection.
     */
    public static String type(Payload payload) {
        return payload.getType();
    }

    public static Attachment attachment(Payload payload) {
        return payload.getAttachment();
    }

    /**
     * Collection helpers to avoid reflection on standard methods.
     */
    public static boolean isEmpty(Collection<?> collection) {
        return collection == null || collection.isEmpty();
    }

    public static int size(Collection<?> collection) {
        return collection == null ? 0 : collection.size();
    }

    public static boolean contains(Collection<?> collection, Object item) {
        return collection != null && collection.contains(item);
    }

    /**
     * AgentInfo helpers to avoid reflection on record methods.
     */
    public static boolean supportsTestType(AgentInfo agent, String testType) {
        return agent.supportsTestType(testType);
    }

    public static boolean supportsTranslationType(AgentInfo agent, String type) {
        return agent.supportsTranslationType(type);
    }
}
