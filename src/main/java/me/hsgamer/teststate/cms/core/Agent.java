package me.hsgamer.teststate.cms.core;

import me.hsgamer.teststate.uap.v1.Capability;

import java.util.List;

public interface Agent {
    String id();

    String displayName();

    List<Capability> capabilities();

    boolean isReady();

    boolean supportsTestType(String testType);
}
