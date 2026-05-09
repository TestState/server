package me.hsgamer.teststate.cms.core;

import java.util.List;

public record TestInfo(String testType, List<Long> payloadIds) {
}
