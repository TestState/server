package me.hsgamer.teststate.cms.core;

public record TranslationTicketResult(boolean accepted, String reason,
                                      TranslationSession session) implements TicketResult {
}
