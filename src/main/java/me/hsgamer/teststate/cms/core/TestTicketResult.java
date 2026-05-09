package me.hsgamer.teststate.cms.core;

public record TestTicketResult(boolean accepted, String reason, TestSession session) implements TicketResult {

}
