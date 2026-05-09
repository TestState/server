package me.hsgamer.teststate.cms.core;

import me.hsgamer.teststate.uap.v1.Payload;

import java.util.List;

public record TestTicket(String testType, List<Payload> payloads) {
}
