package me.hsgamer.teststate.cms.util;

import io.quarkus.qute.TemplateExtension;
import me.hsgamer.teststate.uap.v1.TestState;
import me.hsgamer.teststate.uap.v1.TranslationState;

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
}
