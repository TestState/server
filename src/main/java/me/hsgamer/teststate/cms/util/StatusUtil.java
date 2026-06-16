package me.hsgamer.teststate.cms.util;

import me.hsgamer.teststate.uap.v1.TestState;
import me.hsgamer.teststate.uap.v1.TranslationState;

public class StatusUtil {
    public static boolean isTerminal(TranslationState state) {
        return state == TranslationState.TRANSLATION_STATE_COMPLETED || state == TranslationState.TRANSLATION_STATE_FAILED || state == TranslationState.TRANSLATION_STATE_INVALID;
    }

    public static boolean isTerminal(TestState state) {
        return state == TestState.TEST_STATE_COMPLETED || state == TestState.TEST_STATE_FAILED || state == TestState.TEST_STATE_INVALID;
    }

    public static boolean isTerminal(me.hsgamer.teststate.cms.core.BatchStatus state) {
        return state == me.hsgamer.teststate.cms.core.BatchStatus.COMPLETED || state == me.hsgamer.teststate.cms.core.BatchStatus.FAILED || state == me.hsgamer.teststate.cms.core.BatchStatus.CANCELLED;
    }
}
