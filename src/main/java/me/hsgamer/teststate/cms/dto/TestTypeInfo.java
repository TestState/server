package me.hsgamer.teststate.cms.dto;

import java.util.List;

public record TestTypeInfo(String testType, List<String> requiredPayloadTypes, List<String> optionalPayloadTypes) {
}
