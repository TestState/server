package me.hsgamer.teststate.cms.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.websockets.next.OnClose;
import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.PathParam;
import io.quarkus.websockets.next.WebSocket;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import me.hsgamer.teststate.cms.core.TestBatchSession;
import me.hsgamer.teststate.cms.service.BatchTestManager;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@WebSocket(path = "/telemetry/test/batch/{batchId}")
@Slf4j
public class BatchWebSocket {
    private final Map<String, Runnable> updaters = new ConcurrentHashMap<>();

    @Inject
    BatchTestManager batchTestManager;

    @Inject
    ObjectMapper mapper;

    @OnOpen
    public void onOpen(WebSocketConnection conn, @PathParam("batchId") String id) {
        TestBatchSession b = batchTestManager.getBatchSession(id).orElse(null);
        if (b == null) {
            send(conn, Map.of("type", "ERROR", "message", "Batch not found"));
            conn.close();
            return;
        }

        Runnable updater = () -> send(conn, WSMessage.BatchUpdateMsg.from(b));
        updater.run();
        b.addListener(updater);
        updaters.put(conn.id(), updater);
    }

    @OnClose
    public void onClose(WebSocketConnection conn, @PathParam("batchId") String id) {
        Runnable updater = updaters.remove(conn.id());
        if (updater != null) {
            batchTestManager.getBatchSession(id).ifPresent(b -> b.removeListener(updater));
        }
    }

    private void send(WebSocketConnection conn, Object msg) {
        if (conn == null || !conn.isOpen()) {
            return;
        }
        try {
            conn.sendText(mapper.writeValueAsString(msg)).subscribe().with(v -> {
            }, e -> {
                if (conn.isOpen()) {
                    log.error("Batch WS send failed", e);
                } else {
                    log.debug("Batch WS send failed because connection is closed", e);
                }
            });
        } catch (Exception e) {
            log.error("Batch WS serialization failed", e);
        }
    }
}
