package me.hsgamer.teststate.cms.core;

public interface TicketResult {
    boolean accepted();

    String reason();

    Session<?> session();
}
