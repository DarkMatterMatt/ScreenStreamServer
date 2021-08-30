import { TextDecoder } from "util";
import uWS, { DISABLED, us_listen_socket as usListenSocket, WebSocket } from "uWebSockets.js";
import env from "~/env";
import logger from "~/logger";
import WebSocketRoute from "./WebSocketRoute";
import webSocketRoutes from "./webSocketRoutes";

const WS_CODE_CLOSE_GOING_AWAY = 1001;

process.on("unhandledRejection", err => {
    logger.error("unhandledRejection:", err);
});

process.on("uncaughtException", err => {
    logger.error("uncaughtException:", err);
});

const app = env.USE_SSL ? uWS.SSLApp({
    cert_file_name: env.SSL_CERT_FILE,
    key_file_name: env.SSL_KEY_FILE,
}) : uWS.App();

(async () => {
    const webSockets = new Map<WebSocket, null | string>();
    const channels = new Map<string, [WebSocket, WebSocket?]>();
    let listenSocket: usListenSocket;

    process.on("SIGINT", () => {
        logger.info("Caught interrupt signal");
        logger.debug("Current status", {
            activeWebSockets: webSockets.size,
            version: process.env.npm_package_version,
        });

        [...webSockets.keys()].forEach(ws => ws.end(WS_CODE_CLOSE_GOING_AWAY, "Server is shutting down."));
        uWS.us_listen_socket_close(listenSocket);
        process.exit();
    });

    app.ws("/v1/websocket", {
        compression: DISABLED,

        upgrade: (res, req, context) => {
            res.writeStatus("101 Switching Protocols");

            // TODO: limit who can use our server
            res.writeHeader("Access-Control-Allow-Origin", "*");

            // normal upgrade
            res.upgrade(
                { url: req.getUrl() },
                req.getHeader("sec-websocket-key"),
                req.getHeader("sec-websocket-protocol"),
                req.getHeader("sec-websocket-extensions"),
                context
            );
        },

        open: ws => {
            webSockets.set(ws, null);
        },

        close: ws => {
            // remove ws from channels
            const channelId = webSockets.get(ws);
            if (channelId != null) {
                const channel = channels.get(channelId);
                if (channel != null) {
                    channel.splice(channel.indexOf(ws), 1);
                }
            }

            // remove ws
            webSockets.delete(ws);
        },

        message: (ws, message) => {
            if (message.byteLength === 0) {
                ws.send(JSON.stringify({
                    status: "error",
                    message: "No data received. Expected data in a JSON format.",
                }));
                return;
            }

            let json;
            try {
                json = JSON.parse(new TextDecoder("utf8").decode(message));
                if (typeof json !== "object" || json == null) {
                    throw new Error("Expected an object.");
                }
            }
            catch (e) {
                ws.send(JSON.stringify({
                    status: "error",
                    message: "Invalid JSON data received.",
                }));
                return;
            }

            const routeName = json.route;
            if (typeof routeName !== "string" || routeName === "") {
                ws.send(JSON.stringify({
                    status: "error",
                    message: "Missing 'route' field.",
                }));
                return;
            }

            const route = webSocketRoutes.get(routeName) || webSocketRoutes.get("default") as WebSocketRoute;
            route.execute({ ws, json, webSockets, channels });
        },
    });

    app.get("/generate_204", res => {
        res.writeStatus("204 No Content").end();
    });

    app.any("/*", res => {
        res.writeStatus("404 Not Found");
        res.writeHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            status: "error",
            message: "404 Not Found",
        }));
    });

    const port = env.PORT || 9001;
    app.listen(port, token => {
        if (token) {
            listenSocket = token;
            logger.info(`Listening to port ${port}`);
        }
    });
})();
